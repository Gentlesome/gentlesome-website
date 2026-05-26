const revealItems = document.querySelectorAll(".reveal");
const logo = document.querySelector(".logo");
const textTargets = document.querySelectorAll(
  ".hero-copy, .section-copy, .statement-shell, .feature-card, .frame, .depth-card"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const depthLayers = document.querySelectorAll(".depth-layer");
let isTicking = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getOverlapRatio(firstRect, secondRect) {
  const overlapX = Math.max(
    0,
    Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left)
  );
  const overlapY = Math.max(
    0,
    Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top)
  );

  if (!overlapX || !overlapY) {
    return 0;
  }

  const overlapArea = overlapX * overlapY;
  const firstArea = firstRect.width * firstRect.height;

  if (!firstArea) {
    return 0;
  }

  return clamp(overlapArea / firstArea, 0, 1);
}

function updateLogoVisibility() {
  if (!logo || window.innerWidth <= 760) {
    if (logo) {
      logo.style.setProperty("--logo-opacity", "1");
      logo.style.setProperty("--logo-blur", "0px");
    }
    return;
  }

  const logoRect = logo.getBoundingClientRect();
  let strongestOverlap = 0;
  const isAtTop = window.scrollY < 24;

  if (isAtTop) {
    logo.style.setProperty("--logo-opacity", "1");
    logo.style.setProperty("--logo-blur", "0px");
    return;
  }

  textTargets.forEach((target) => {
    const targetStyle = window.getComputedStyle(target);

    if (targetStyle.display === "none" || targetStyle.visibility === "hidden") {
      return;
    }

    const ratio = getOverlapRatio(logoRect, target.getBoundingClientRect());
    strongestOverlap = Math.max(strongestOverlap, ratio);
  });

  const isObscured = strongestOverlap > 0.018;
  const opacity = isObscured ? 0 : 1;
  const blur = isObscured ? 9 : 0;

  logo.style.setProperty("--logo-opacity", String(opacity));
  logo.style.setProperty("--logo-blur", `${blur}px`);
}

function updateDepth() {
  const viewportMid = window.innerHeight / 2;

  depthLayers.forEach((layer) => {
    const rect = layer.getBoundingClientRect();
    const layerMid = rect.top + rect.height / 2;
    const distance = layerMid - viewportMid;
    const speed = Number(layer.dataset.speed || 0);
    const offset = distance * speed * -0.32;

    layer.style.setProperty("--float-offset", `${offset.toFixed(1)}px`);
  });

  updateLogoVisibility();
  isTicking = false;
}

function queueDepthUpdate() {
  if (!isTicking) {
    window.requestAnimationFrame(updateDepth);
    isTicking = true;
  }
}

window.addEventListener("scroll", queueDepthUpdate, { passive: true });
window.addEventListener("resize", queueDepthUpdate);
window.addEventListener("load", queueDepthUpdate);

queueDepthUpdate();
