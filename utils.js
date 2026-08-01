// customer-app/js/utils.js
// Reusable, pure helper functions used across every customer-app page.
// No Firebase imports here — keep this module framework-agnostic.

import { CURRENCY, DESIGN_UPLOAD_RULES } from "./constants.js";

/**
 * Format a number as Indian Rupee currency, e.g. 1499 -> "₹1,499"
 */
export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: "currency",
    currency: CURRENCY.CODE,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a Firestore Timestamp, Date, or ISO string into a readable date,
 * e.g. "31 Jul 2026, 4:45 PM"
 */
export function formatDate(input) {
  let date;
  if (!input) return "";
  if (typeof input.toDate === "function") {
    date = input.toDate(); // Firestore Timestamp
  } else if (input instanceof Date) {
    date = input;
  } else {
    date = new Date(input);
  }
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Relative time, e.g. "2 hours ago", "Just now"
 */
export function timeAgo(input) {
  let date;
  if (typeof input?.toDate === "function") {
    date = input.toDate();
  } else {
    date = new Date(input);
  }
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Debounce a function call — useful for search inputs.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Generate a short, human-friendly order number like "ZP-8F3K2Q"
 */
export function generateOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ZP-${code}`;
}

/**
 * Basic email format validation.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/**
 * Basic Indian phone number validation (10 digits, optionally +91 prefixed).
 */
export function isValidPhone(phone) {
  return /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(String(phone).trim());
}

/**
 * Basic Indian PIN code validation (6 digits).
 */
export function isValidPincode(pincode) {
  return /^[1-9][0-9]{5}$/.test(String(pincode).trim());
}

/**
 * Validate a design upload file against allowed type + size rules.
 * Returns { valid: boolean, error: string|null }
 */
export function validateDesignFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }
  const typeOk = DESIGN_UPLOAD_RULES.ALLOWED_TYPES.includes(file.type);
  if (!typeOk) {
    return { valid: false, error: "Only PNG, JPG, JPEG, or PDF files are allowed." };
  }
  if (file.size > DESIGN_UPLOAD_RULES.MAX_SIZE_BYTES) {
    const maxMb = DESIGN_UPLOAD_RULES.MAX_SIZE_BYTES / (1024 * 1024);
    return { valid: false, error: `File must be smaller than ${maxMb}MB.` };
  }
  return { valid: true, error: null };
}

/**
 * Read a single query-string parameter from the current URL.
 */
export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * Navigate to another page carrying query params, e.g.
 * goTo('/pages/product-details.html', { id: 'abc123' })
 */
export function goTo(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  window.location.href = query ? `${path}?${query}` : path;
}

/**
 * Escape HTML to prevent XSS when injecting user-provided text into the DOM.
 */
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Simple synchronous sleep for orchestrating animations.
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
