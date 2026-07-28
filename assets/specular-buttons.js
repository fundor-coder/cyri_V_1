const SPECULAR_SELECTOR = ".button, .card-button";
const PROXIMITY = 250;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let targets = [];
let pointerX = -1000;
let pointerY = -1000;
let frameId = 0;

function collectTargets() {
  targets = [...document.querySelectorAll(SPECULAR_SELECTOR)];
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function updateHighlights() {
  frameId = 0;

  for (const target of targets) {
    if (!target.isConnected || target.disabled) continue;

    const bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) continue;

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const distanceX = Math.max(bounds.left - pointerX, 0, pointerX - bounds.right);
    const distanceY = Math.max(bounds.top - pointerY, 0, pointerY - bounds.bottom);
    const distance = Math.hypot(distanceX, distanceY);
    const proximity = Math.max(0, 1 - distance / PROXIMITY);
    const brightness = smoothstep(proximity);
    const angle = Math.atan2(centerY - pointerY, pointerX - centerX) * (180 / Math.PI);

    target.style.setProperty("--specular-angle", `${angle + 90}deg`);
    target.style.setProperty(
      "--specular-brightness",
      reducedMotion.matches ? String(brightness > 0 ? 0.55 : 0) : brightness.toFixed(3)
    );
  }
}

function scheduleUpdate(event) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!frameId) frameId = requestAnimationFrame(updateHighlights);
}

const observer = new MutationObserver(() => {
  collectTargets();
  if (!frameId) frameId = requestAnimationFrame(updateHighlights);
});

collectTargets();
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener("pointermove", scheduleUpdate, { passive: true });
window.addEventListener("scroll", () => {
  if (!frameId) frameId = requestAnimationFrame(updateHighlights);
}, { passive: true });
