// customer-app/components/bottom-nav.js
// Reusable bottom navigation bar. Injects itself into a container element
// and highlights whichever tab matches the current page.
//
// Usage in a page's own <script type="module">:
//   import { renderBottomNav } from "../components/bottom-nav.js";
//   renderBottomNav("home"); // one of: home, categories, cart, orders, profile

import { ROUTES } from "../js/constants.js";

const TABS = [
  { key: "home", label: "Home", route: ROUTES.HOME, icon: iconHome() },
  { key: "categories", label: "Categories", route: ROUTES.CATEGORIES, icon: iconGrid() },
  { key: "cart", label: "Cart", route: ROUTES.CART, icon: iconCart() },
  { key: "orders", label: "Orders", route: ROUTES.ORDERS, icon: iconOrders() },
  { key: "profile", label: "Profile", route: ROUTES.PROFILE, icon: iconProfile() }
];

/**
 * Render the bottom nav bar and append it to <body>.
 * @param {string} activeKey - which tab should be highlighted
 */
export function renderBottomNav(activeKey) {
  const existing = document.querySelector(".zp-bottom-nav");
  if (existing) existing.remove();

  const nav = document.createElement("nav");
  nav.className = "zp-bottom-nav";
  nav.setAttribute("aria-label", "Primary");

  TABS.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `zp-bottom-nav__item${tab.key === activeKey ? " zp-bottom-nav__item--active" : ""}`;
    btn.setAttribute("aria-current", tab.key === activeKey ? "page" : "false");
    btn.innerHTML = `${tab.icon}<span>${tab.label}</span>`;
    btn.addEventListener("click", () => {
      if (tab.key !== activeKey) window.location.href = tab.route;
    });
    nav.appendChild(btn);
  });

  document.body.appendChild(nav);
  return nav;
}

/* ---- Inline icon strings (no external icon font dependency) ---- */
function iconHome() {
  return `<svg class="zp-bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function iconGrid() {
  return `<svg class="zp-bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>`;
}
function iconCart() {
  return `<svg class="zp-bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 4h2l1.2 12.4a2 2 0 0 0 2 1.8h8.6a2 2 0 0 0 2-1.7L20 8H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="16.5" cy="20" r="1.4"/></svg>`;
}
function iconOrders() {
  return `<svg class="zp-bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke-linecap="round"/></svg>`;
}
function iconProfile() {
  return `<svg class="zp-bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke-linecap="round"/></svg>`;
}
