// customer-app/js/loader.js
// The app-wide loading overlay: four dots (Cyan, Magenta, Yellow, Key)
// converging like a print press aligning color separations.
// Usage: import { showLoader, hideLoader } from "./loader.js";

let overlay = null;
let activeCount = 0;

function build() {
  const el = document.createElement("div");
  el.className = "zp-loader-overlay";
  el.innerHTML = `
    <div class="zp-loader" role="status" aria-label="Loading">
      <span class="zp-loader__dot zp-loader__dot--c"></span>
      <span class="zp-loader__dot zp-loader__dot--m"></span>
      <span class="zp-loader__dot zp-loader__dot--y"></span>
      <span class="zp-loader__dot zp-loader__dot--k"></span>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

/**
 * Show the full-screen loading overlay. Calls stack safely —
 * the overlay only hides once every showLoader() has a matching hideLoader().
 */
export function showLoader() {
  activeCount += 1;
  if (!overlay) {
    overlay = build();
  }
  overlay.classList.add("zp-loader-overlay--visible");
}

export function hideLoader(force = false) {
  activeCount = force ? 0 : Math.max(0, activeCount - 1);
  if (activeCount === 0 && overlay) {
    overlay.classList.remove("zp-loader-overlay--visible");
  }
}
