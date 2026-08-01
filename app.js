/* ============================================================
   ZESTO PRINT — app.js
   Single-file JavaScript for the whole SPA. Sections are added
   part by part; each part's code is clearly commented below.
============================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================================================
   PART 1 — FIREBASE CONFIG
   Paste your Firebase project config below. Get it from:
   Firebase Console → Project Settings → General → Your apps → SDK setup
========================================================= */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
/* =========================================================
   END FIREBASE CONFIG
========================================================= */

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Auth persistence error:", err);
});

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence disabled: multiple tabs open.");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence not supported in this browser.");
  }
});

/* =========================================================
   PART 1 — CONSTANTS
========================================================= */
const COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  ORDERS: "orders",
  ORDER_ITEMS: "order_items",
  DESIGN_UPLOADS: "design_uploads",
  ADDRESSES: "addresses",
  NOTIFICATIONS: "notifications",
  REVIEWS: "reviews",
  SETTINGS: "settings"
};

const STORAGE_PATHS = {
  PRODUCTS: "products",
  DESIGNS: "designs",
  USERS: "users"
};

const ORDER_STATUS = {
  PLACED: "placed",
  CONFIRMED: "confirmed",
  PRINTING: "printing",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

const ORDER_STATUS_FLOW = [
  { key: ORDER_STATUS.PLACED, label: "Order Placed" },
  { key: ORDER_STATUS.CONFIRMED, label: "Confirmed" },
  { key: ORDER_STATUS.PRINTING, label: "Printing" },
  { key: ORDER_STATUS.PACKED, label: "Packed" },
  { key: ORDER_STATUS.SHIPPED, label: "Shipped" },
  { key: ORDER_STATUS.OUT_FOR_DELIVERY, label: "Out for Delivery" },
  { key: ORDER_STATUS.DELIVERED, label: "Delivered" }
];

const DESIGN_UPLOAD_RULES = {
  ALLOWED_TYPES: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
  MAX_SIZE_BYTES: 25 * 1024 * 1024 // 25 MB
};

const CURRENCY = { CODE: "INR", LOCALE: "en-IN" };

// Every screen's <section id="view-{key}"> — later parts add more views here
// and their nav-triggering logic; the router itself never needs to change.
const VIEWS = {
  SPLASH: "splash",
  LOGIN: "login",
  SIGNUP: "signup",
  FORGOT_PASSWORD: "forgot-password",
  HOME: "home",
  CATEGORIES: "categories",
  PRODUCT_LIST: "product-list",
  PRODUCT_DETAILS: "product-details",
  CUSTOMIZE_PRODUCT: "customize-product",
  CART: "cart",
  CHECKOUT: "checkout",
  ORDER_SUCCESS: "order-success",
  ORDER_TRACKING: "order-tracking",
  ORDERS: "orders",
  ADDRESSES: "addresses",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile"
};

/* =========================================================
   PART 1 — UTILITIES
========================================================= */
function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: "currency",
    currency: CURRENCY.CODE,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(input) {
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
    day: "2-digit", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

function timeAgo(input) {
  let date = typeof input?.toDate === "function" ? input.toDate() : new Date(input);
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

function debounce(fn, delay = 300) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function generateOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ZP-${code}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidPhone(phone) {
  return /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(String(phone).trim());
}

function isValidPincode(pincode) {
  return /^[1-9][0-9]{5}$/.test(String(pincode).trim());
}

function validateDesignFile(file) {
  if (!file) return { valid: false, error: "No file selected." };
  if (!DESIGN_UPLOAD_RULES.ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Only PNG, JPG, JPEG, or PDF files are allowed." };
  }
  if (file.size > DESIGN_UPLOAD_RULES.MAX_SIZE_BYTES) {
    const maxMb = DESIGN_UPLOAD_RULES.MAX_SIZE_BYTES / (1024 * 1024);
    return { valid: false, error: `File must be smaller than ${maxMb}MB.` };
  }
  return { valid: true, error: null };
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =========================================================
   PART 1 — TOAST NOTIFICATIONS
========================================================= */
const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "info", duration = 3200) {
  const toast = document.createElement("div");
  toast.className = `zp-toast zp-toast--${type}`;
  toast.setAttribute("role", "status");

  const icon = document.createElement("span");
  icon.className = "zp-toast__icon";
  icon.textContent = { success: "\u2713", error: "\u2715", warning: "\u26A0" }[type] || "\u2139";

  const text = document.createElement("span");
  text.className = "zp-toast__text";
  text.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "zp-toast__close";
  closeBtn.setAttribute("aria-label", "Dismiss notification");
  closeBtn.textContent = "\u00D7";
  closeBtn.addEventListener("click", () => dismissToast(toast));

  toast.append(icon, text, closeBtn);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("zp-toast--visible"));
  const timer = setTimeout(() => dismissToast(toast), duration);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));

  return toast;
}

function dismissToast(toast) {
  toast.classList.remove("zp-toast--visible");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
}

/* =========================================================
   PART 1 — LOADER OVERLAY
========================================================= */
const loaderOverlay = document.getElementById("loaderOverlay");
let loaderActiveCount = 0;

function showLoader() {
  loaderActiveCount += 1;
  loaderOverlay.classList.add("zp-loader-overlay--visible");
}

function hideLoader(force = false) {
  loaderActiveCount = force ? 0 : Math.max(0, loaderActiveCount - 1);
  if (loaderActiveCount === 0) loaderOverlay.classList.remove("zp-loader-overlay--visible");
}

/* =========================================================
   PART 1 — SPA ROUTER
   Every screen lives in index.html as <section id="view-{key}" class="view">.
   navigateTo() hides all views and shows the requested one. Later parts
   call navigateTo(VIEWS.X) from their own event handlers — this core
   function never needs to change again.
========================================================= */
let currentView = null;
const viewChangeListeners = [];

function navigateTo(viewKey, params = {}) {
  const targetEl = document.getElementById(`view-${viewKey}`);
  if (!targetEl) {
    console.warn(`navigateTo: view "${viewKey}" doesn't exist yet — skipping.`);
    return;
  }

  document.querySelectorAll(".view").forEach((el) => el.classList.remove("view--active"));
  targetEl.classList.add("view--active");
  window.scrollTo(0, 0);

  currentView = viewKey;
  viewChangeListeners.forEach((fn) => fn(viewKey, params));
}

function onViewChange(fn) {
  viewChangeListeners.push(fn);
}

function getCurrentView() {
  return currentView;
}

/* =========================================================
   PART 1 — SPLASH SCREEN CONTROLLER
   Resolves Firebase auth state, holds for a minimum splash
   duration so the brand animation isn't cut short, then routes.
========================================================= */
const MIN_SPLASH_DURATION_MS = 1200;

async function bootSplash() {
  const start = Date.now();

  const authResolved = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  const user = await authResolved;
  const elapsed = Date.now() - start;
  if (elapsed < MIN_SPLASH_DURATION_MS) {
    await sleep(MIN_SPLASH_DURATION_MS - elapsed);
  }

  // Part 2 adds the "login" and "home" views — until then this will
  // no-op with a console warning, which is expected.
  navigateTo(user ? VIEWS.HOME : VIEWS.LOGIN);
}

/* =========================================================
   PART 1 — APP BOOTSTRAP
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  bootSplash();
});

/* Further parts append their controllers below this line. */
