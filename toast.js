// customer-app/js/toast.js
// Reusable toast notification system.
// Usage: import { showToast } from "./toast.js";
//        showToast("Design uploaded", "success");

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement("div");
  container.className = "zp-toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  document.body.appendChild(container);
  return container;
}

/**
 * Show a toast message.
 * @param {string} message
 * @param {"success"|"error"|"info"|"warning"} type
 * @param {number} duration - ms before auto-dismiss
 */
export function showToast(message, type = "info", duration = 3200) {
  const root = ensureContainer();

  const toast = document.createElement("div");
  toast.className = `zp-toast zp-toast--${type}`;
  toast.setAttribute("role", "status");

  const icon = document.createElement("span");
  icon.className = "zp-toast__icon";
  icon.textContent = iconFor(type);

  const text = document.createElement("span");
  text.className = "zp-toast__text";
  text.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "zp-toast__close";
  closeBtn.setAttribute("aria-label", "Dismiss notification");
  closeBtn.textContent = "\u00D7";
  closeBtn.addEventListener("click", () => dismiss(toast));

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(closeBtn);
  root.appendChild(toast);

  // Trigger enter animation on next frame.
  requestAnimationFrame(() => toast.classList.add("zp-toast--visible"));

  const timer = setTimeout(() => dismiss(toast), duration);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));

  return toast;
}

function dismiss(toast) {
  toast.classList.remove("zp-toast--visible");
  toast.addEventListener(
    "transitionend",
    () => toast.remove(),
    { once: true }
  );
}

function iconFor(type) {
  switch (type) {
    case "success":
      return "\u2713";
    case "error":
      return "\u2715";
    case "warning":
      return "\u26A0";
    default:
      return "\u2139";
  }
}
