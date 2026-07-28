const root = document.querySelector("[data-option-wheel]");

if (root) {
  const items = [...root.querySelectorAll(".option-wheel__item")];
  const title = document.querySelector("[data-option-wheel-title]");
  const hint = document.querySelector("[data-option-wheel-hint]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const config = {
    rowHeight: 92,
    curve: 0.86,
    tilt: 10,
    blur: 0.7,
    fade: 0.2,
    minOpacity: 0.16,
    smoothing: 180,
  };

  let position = 0;
  let target = 0;
  let selectedIndex = 0;
  let frameId = 0;
  let lastFrame = 0;
  let wheelTimer = 0;
  let drag = null;
  let dragMoved = false;

  function updateLanguageHint() {
    const german = document.documentElement.lang === "de";
    if (title) title.textContent = german ? "Menü" : "Menu";
    if (hint) hint.textContent = german
      ? "Scrollen · ziehen · Pfeiltasten"
      : "Scroll · drag · arrow keys";
    root.setAttribute("aria-label", german ? "Hauptnavigation" : "Primary navigation");
  }

  function setSelected(index) {
    selectedIndex = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((item, itemIndex) => {
      const selected = itemIndex === selectedIndex;
      item.classList.toggle("option-wheel__item--selected", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
  }

  function layout() {
    const tiltRadians = (config.tilt * Math.PI) / 180;
    const radius = config.rowHeight / tiltRadians;

    items.forEach((item, index) => {
      const delta = index - position;
      const distance = Math.abs(delta);
      const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, delta * tiltRadians));
      const y = radius * Math.sin(angle);
      const x = radius * (1 - Math.cos(angle)) * config.curve;
      const rotation = -(angle * 180) / Math.PI;
      const opacity = Math.max(config.minOpacity, 1 - distance * config.fade);

      item.style.transform = `translate(${-x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(2)}deg)`;
      item.style.opacity = opacity.toFixed(3);
      item.style.filter = `blur(${(distance * config.blur).toFixed(2)}px)`;
      item.style.setProperty(
        "--ow-position",
        Math.max(0, 1 - Math.min(distance, 1)).toFixed(3)
      );
    });
  }

  function runFrame(now) {
    const elapsed = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    const smoothing = reducedMotion.matches ? 1 : config.smoothing / 1000;
    const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / smoothing);
    position += (target - position) * easing;

    if (Math.abs(target - position) < 0.001) {
      position = target;
      frameId = 0;
    } else {
      frameId = requestAnimationFrame(runFrame);
    }
    layout();
  }

  function startAnimation() {
    if (frameId) return;
    lastFrame = performance.now();
    frameId = requestAnimationFrame(runFrame);
  }

  function select(value, snap = true) {
    target = Math.max(0, Math.min(items.length - 1, snap ? Math.round(value) : value));
    setSelected(Math.round(target));
    startAnimation();
  }

  function syncToCurrentPage() {
    const activeIndex = items.findIndex((item) => item.classList.contains("is-active"));
    const nextIndex = activeIndex >= 0 ? activeIndex : 0;
    target = nextIndex;
    position = nextIndex;
    setSelected(nextIndex);
    layout();
  }

  function resizeWheel() {
    config.rowHeight = Math.min(90, Math.max(68, root.clientHeight / 9.8));
    layout();
  }

  root.addEventListener("wheel", (event) => {
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY;
    const step = Math.max(-1, Math.min(1, delta / config.rowHeight));
    select(target + step, false);
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => select(target, true), 140);
  }, { passive: false });

  root.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    drag = { y: event.clientY, start: target, id: event.pointerId };
    dragMoved = false;
    root.classList.add("is-dragging");
  });

  root.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const delta = event.clientY - drag.y;
    if (!dragMoved && Math.abs(delta) > 4) {
      dragMoved = true;
      root.setPointerCapture(drag.id);
    }
    if (dragMoved) select(drag.start - delta / config.rowHeight, false);
  });

  function finishDrag() {
    if (!drag) return;
    drag = null;
    root.classList.remove("is-dragging");
    if (dragMoved) select(target, true);
    window.setTimeout(() => {
      dragMoved = false;
    }, 0);
  }

  root.addEventListener("pointerup", finishDrag);
  root.addEventListener("pointercancel", finishDrag);

  root.addEventListener("click", (event) => {
    const item = event.target.closest(".option-wheel__item");
    if (!item) {
      document.dispatchEvent(new CustomEvent("cyri:menu-close"));
      return;
    }
    if (dragMoved) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    select(items.indexOf(item));
  });

  root.addEventListener("keydown", (event) => {
    let next = null;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = selectedIndex - 1;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = selectedIndex + 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      items[selectedIndex]?.click();
      return;
    }
    if (next === null) return;
    event.preventDefault();
    select(next);
  });

  document.addEventListener("cyri:menu-open", syncToCurrentPage);
  new ResizeObserver(resizeWheel).observe(root);
  new MutationObserver(updateLanguageHint).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  updateLanguageHint();
  syncToCurrentPage();
  resizeWheel();
}
