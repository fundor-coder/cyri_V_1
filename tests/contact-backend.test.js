const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server.address().port);
    });
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function freePort() {
  const server = http.createServer();
  const port = await listen(server);
  await close(server);
  return port;
}

async function waitForHealth(baseUrl, child, stderr) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Backend exited before startup: ${stderr()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Backend did not start: ${stderr()}`);
}

async function contactRequest(baseUrl, body, extraHeaders = {}) {
  return fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Sec-Fetch-Site": "same-origin",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  });
}

test("contact backend validates, stores and securely delivers messages", async (t) => {
  const providerRequests = [];
  const provider = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    providerRequests.push({ headers: req.headers, body });

    if (body.text.includes("provider-failure")) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "simulated failure" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: `mock-email-${providerRequests.length}` }));
  });
  const providerPort = await listen(provider);
  t.after(() => close(provider));

  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "cyri-contact-test-"));
  await fs.writeFile(path.join(dataDir, "messages.json"), JSON.stringify([
    {
      id: "expired-message",
      name: "Old",
      email: "old@example.com",
      message: "This message must be removed.",
      createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]));

  const appPort = await freePort();
  const baseUrl = `http://127.0.0.1:${appPort}`;
  let stderr = "";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(appPort),
      CYRI_DATA_DIR: dataDir,
      RESEND_API_KEY: "re_test_secret",
      RESEND_API_URL: `http://127.0.0.1:${providerPort}/emails`,
      CYRI_CONTACT_FROM: "CYRI Website <website@send.cyri.online>",
      CYRI_CONTACT_TO: "climateyri@gmail.com",
      CYRI_TRUST_PROXY: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  t.after(() => {
    if (child.exitCode === null) child.kill("SIGTERM");
  });
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  await waitForHealth(baseUrl, child, () => stderr);

  const successResponse = await contactRequest(baseUrl, {
    name: "Alex Example",
    email: "alex@example.com",
    message: "I have a question about the mangrove article.",
    website: "",
    startedAt: Date.now() - 3000,
  });
  assert.equal(successResponse.status, 201);
  assert.deepEqual(await successResponse.json(), { ok: true });
  assert.equal(providerRequests.length, 1);

  const deliveryRequest = providerRequests[0];
  assert.equal(deliveryRequest.headers.authorization, "Bearer re_test_secret");
  assert.equal(deliveryRequest.headers["user-agent"], "CYRI-Website/1.0");
  assert.match(deliveryRequest.headers["idempotency-key"], /^contact-[a-f0-9-]+$/);
  assert.equal(deliveryRequest.body.from, "CYRI Website <website@send.cyri.online>");
  assert.deepEqual(deliveryRequest.body.to, ["climateyri@gmail.com"]);
  assert.equal(deliveryRequest.body.reply_to, "alex@example.com");
  assert.equal(deliveryRequest.body.subject, "New contact message via cyri.online");
  assert.equal(deliveryRequest.body.html, undefined);
  assert.match(deliveryRequest.body.text, /Alex Example/);
  assert.match(deliveryRequest.body.text, /question about the mangrove article/);

  let storedMessages = JSON.parse(
    await fs.readFile(path.join(dataDir, "messages.json"), "utf8")
  );
  assert.equal(storedMessages.length, 1, "expired messages should be removed");
  assert.equal(storedMessages[0].delivery.status, "sent");
  assert.equal(storedMessages[0].delivery.emailId, "mock-email-1");
  assert.doesNotMatch(JSON.stringify(storedMessages), /re_test_secret/);

  const honeypotResponse = await contactRequest(baseUrl, {
    name: "Bot",
    email: "bot@example.com",
    message: "Automated spam message.",
    website: "https://spam.example",
  });
  assert.equal(honeypotResponse.status, 201);
  assert.equal(providerRequests.length, 1, "honeypot submissions must not send email");

  const crossSiteResponse = await contactRequest(
    baseUrl,
    {
      name: "Cross Site",
      email: "cross@example.com",
      message: "This cross-site request should not pass.",
      startedAt: Date.now() - 3000,
    },
    { "Sec-Fetch-Site": "cross-site" }
  );
  assert.equal(crossSiteResponse.status, 403);

  const fastResponse = await contactRequest(baseUrl, {
    name: "Fast User",
    email: "fast@example.com",
    message: "This submission was completed too quickly.",
    startedAt: Date.now(),
  });
  assert.equal(fastResponse.status, 400);

  const invalidEmailResponse = await contactRequest(baseUrl, {
    name: "Invalid Email",
    email: "not-an-email",
    message: "This submission contains an invalid address.",
    startedAt: Date.now() - 3000,
  });
  assert.equal(invalidEmailResponse.status, 400);

  const oversizedResponse = await contactRequest(baseUrl, {
    name: "Large Message",
    email: "large@example.com",
    message: "x".repeat(17000),
    startedAt: Date.now() - 3000,
  });
  assert.equal(oversizedResponse.status, 413);

  const providerFailureResponse = await contactRequest(baseUrl, {
    name: "Provider Failure",
    email: "failure@example.com",
    message: "Please trigger provider-failure for this test.",
    startedAt: Date.now() - 3000,
  });
  assert.equal(providerFailureResponse.status, 502);
  storedMessages = JSON.parse(
    await fs.readFile(path.join(dataDir, "messages.json"), "utf8")
  );
  assert.equal(storedMessages[0].delivery.status, "failed");
  assert.equal(storedMessages[1].delivery.status, "sent");

  const rateLimitEntries = JSON.parse(
    await fs.readFile(path.join(dataDir, "contact-rate-limits.json"), "utf8")
  );
  assert.equal(rateLimitEntries.length, 1);
  assert.match(rateLimitEntries[0].client, /^[a-f0-9]{64}$/);
  assert.notEqual(rateLimitEntries[0].client, "127.0.0.1");
});
