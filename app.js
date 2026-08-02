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
  browserSessionPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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

// Views that show the bottom nav bar, keyed to their tab's data-tab value.
const PRIMARY_VIEWS = {
  [VIEWS.HOME]: "home",
  [VIEWS.CATEGORIES]: "categories",
  [VIEWS.CART]: "cart",
  [VIEWS.ORDERS]: "orders",
  [VIEWS.PROFILE]: "profile"
};

function navigateTo(viewKey, params = {}) {
  const targetEl = document.getElementById(`view-${viewKey}`);
  if (!targetEl) {
    console.warn(`navigateTo: view "${viewKey}" doesn't exist yet — skipping.`);
    return;
  }

  document.querySelectorAll(".view").forEach((el) => el.classList.remove("view--active"));
  targetEl.classList.add("view--active");
  window.scrollTo(0, 0);

  const bottomNav = document.getElementById("bottomNav");
  if (bottomNav) {
    const activeTab = PRIMARY_VIEWS[viewKey];
    bottomNav.classList.toggle("zp-bottom-nav--visible", Boolean(activeTab));
    bottomNav.querySelectorAll(".zp-bottom-nav__item").forEach((btn) => {
      btn.classList.toggle("zp-bottom-nav__item--active", btn.dataset.tab === activeTab);
    });
  }

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
   PART 2 — AUTH SERVICE
   Thin wrapper around Firebase Auth so every view calls the same
   functions instead of touching the SDK directly.
========================================================= */
const googleProvider = new GoogleAuthProvider();

async function applyRememberMePersistence(remember) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

async function registerUser({ fullName, email, phone, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: fullName });

  await setDoc(doc(db, COLLECTIONS.USERS, credential.user.uid), {
    uid: credential.user.uid,
    fullName,
    email,
    phone,
    photoURL: credential.user.photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return credential.user;
}

async function loginUser({ email, password, remember }) {
  await applyRememberMePersistence(remember);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

async function sendReset(email) {
  await sendPasswordResetEmail(auth, email);
}

async function logoutUser() {
  await signOut(auth);
}

/**
 * Google sign-in. Creates the users/{uid} Firestore doc on first sign-in
 * only — subsequent sign-ins leave the existing profile untouched.
 */
async function signInWithGoogle({ remember = true } = {}) {
  await applyRememberMePersistence(remember);
  const result = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, COLLECTIONS.USERS, result.user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: result.user.uid,
      fullName: result.user.displayName || "",
      email: result.user.email || "",
      phone: result.user.phoneNumber || "",
      photoURL: result.user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  return result.user;
}

function mapAuthError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support for help.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with that email. Try logging in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before finishing.";
    case "auth/cancelled-popup-request":
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Please allow popups and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/* =========================================================
   PART 2 — GLOBAL DELEGATED HANDLERS
   These live at document level so every current AND future view
   gets nav-buttons and password-toggle buttons for free — no view
   controller needs to re-wire them.
========================================================= */
document.addEventListener("click", (event) => {
  const navBtn = event.target.closest(".js-nav");
  if (navBtn) {
    navigateTo(navBtn.dataset.view);
    return;
  }

  const toggleBtn = event.target.closest("[data-toggle-password]");
  if (toggleBtn) {
    const targetInput = document.getElementById(toggleBtn.dataset.togglePassword);
    if (!targetInput) return;
    const isHidden = targetInput.type === "password";
    targetInput.type = isHidden ? "text" : "password";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    toggleBtn.textContent = isHidden ? "\u{1F576}" : "\u{1F441}";
  }
});

/* =========================================================
   PART 2 — LOGIN VIEW
========================================================= */
function initLoginView() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  const generalError = document.getElementById("loginGeneralError");
  const generalErrorText = document.getElementById("loginGeneralErrorText");
  const submitBtn = document.getElementById("loginSubmit");
  const rememberMe = document.getElementById("loginRememberMe");
  const googleBtn = document.getElementById("loginGoogleBtn");

  function clearErrors() {
    emailError.textContent = "";
    passwordError.textContent = "";
    emailInput.classList.remove("zp-input--error");
    passwordInput.classList.remove("zp-input--error");
    generalError.classList.remove("zp-auth__general-error--visible");
  }

  function setFieldError(input, errorEl, message) {
    input.classList.add("zp-input--error");
    errorEl.textContent = message;
  }

  function showGeneralError(message) {
    generalErrorText.textContent = message;
    generalError.classList.add("zp-auth__general-error--visible");
  }

  function validate() {
    let valid = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      setFieldError(emailInput, emailError, "Email is required.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, "Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setFieldError(passwordInput, passwordError, "Password is required.");
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    if (!validate()) return;

    submitBtn.disabled = true;
    showLoader();
    try {
      await loginUser({
        email: emailInput.value.trim(),
        password: passwordInput.value,
        remember: rememberMe.checked
      });
      showToast("Welcome back!", "success");
      form.reset();
      navigateTo(VIEWS.HOME);
    } catch (error) {
      console.error("Login error:", error);
      showGeneralError(mapAuthError(error));
    } finally {
      hideLoader();
      submitBtn.disabled = false;
    }
  });

  googleBtn.addEventListener("click", async () => {
    clearErrors();
    googleBtn.disabled = true;
    showLoader();
    try {
      await signInWithGoogle({ remember: rememberMe.checked });
      showToast("Welcome back!", "success");
      navigateTo(VIEWS.HOME);
    } catch (error) {
      console.error("Google sign-in error:", error);
      showGeneralError(mapAuthError(error));
    } finally {
      hideLoader();
      googleBtn.disabled = false;
    }
  });
}

/* =========================================================
   PART 2 — SIGNUP VIEW
========================================================= */
function initSignupView() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const nameInput = document.getElementById("signupName");
  const emailInput = document.getElementById("signupEmail");
  const phoneInput = document.getElementById("signupPhone");
  const passwordInput = document.getElementById("signupPassword");
  const confirmPasswordInput = document.getElementById("signupConfirmPassword");

  const nameError = document.getElementById("signupNameError");
  const emailError = document.getElementById("signupEmailError");
  const phoneError = document.getElementById("signupPhoneError");
  const passwordError = document.getElementById("signupPasswordError");
  const confirmPasswordError = document.getElementById("signupConfirmPasswordError");

  const generalError = document.getElementById("signupGeneralError");
  const generalErrorText = document.getElementById("signupGeneralErrorText");
  const submitBtn = document.getElementById("signupSubmit");
  const googleBtn = document.getElementById("signupGoogleBtn");
  const strengthBars = document.querySelectorAll("#signupStrength .zp-strength__bar");

  passwordInput.addEventListener("input", () => updateStrengthMeter(passwordInput.value));

  function updateStrengthMeter(password) {
    const score = passwordScore(password);
    strengthBars.forEach((bar, index) => {
      bar.className = "zp-strength__bar";
      if (password.length === 0) return;
      if (index === 0 && score >= 1) bar.classList.add("zp-strength__bar--weak");
      if (index === 1 && score >= 2) bar.classList.add("zp-strength__bar--fair");
      if (index === 2 && score >= 3) bar.classList.add("zp-strength__bar--strong");
    });
  }

  function passwordScore(password) {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
    if (password.length >= 10 && /[^a-zA-Z0-9]/.test(password)) score += 1;
    return score;
  }

  function clearErrors() {
    [nameError, emailError, phoneError, passwordError, confirmPasswordError].forEach((el) => (el.textContent = ""));
    [nameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput].forEach((el) =>
      el.classList.remove("zp-input--error")
    );
    generalError.classList.remove("zp-auth__general-error--visible");
  }

  function setFieldError(input, errorEl, message) {
    input.classList.add("zp-input--error");
    errorEl.textContent = message;
  }

  function showGeneralError(message) {
    generalErrorText.textContent = message;
    generalError.classList.add("zp-auth__general-error--visible");
  }

  function validate() {
    let valid = true;
    const fullName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!fullName) {
      setFieldError(nameInput, nameError, "Full name is required.");
      valid = false;
    } else if (fullName.length < 2) {
      setFieldError(nameInput, nameError, "Enter your full name.");
      valid = false;
    }

    if (!email) {
      setFieldError(emailInput, emailError, "Email is required.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, "Enter a valid email address.");
      valid = false;
    }

    if (!phone) {
      setFieldError(phoneInput, phoneError, "Phone number is required.");
      valid = false;
    } else if (!isValidPhone(phone)) {
      setFieldError(phoneInput, phoneError, "Enter a valid 10-digit mobile number.");
      valid = false;
    }

    if (!password) {
      setFieldError(passwordInput, passwordError, "Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setFieldError(passwordInput, passwordError, "Password must be at least 6 characters.");
      valid = false;
    }

    if (!confirmPassword) {
      setFieldError(confirmPasswordInput, confirmPasswordError, "Please confirm your password.");
      valid = false;
    } else if (password && confirmPassword !== password) {
      setFieldError(confirmPasswordInput, confirmPasswordError, "Passwords don't match.");
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    if (!validate()) return;

    submitBtn.disabled = true;
    showLoader();
    try {
      await registerUser({
        fullName: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: passwordInput.value
      });
      showToast("Account created! Welcome to Zesto Print.", "success");
      form.reset();
      updateStrengthMeter("");
      navigateTo(VIEWS.HOME);
    } catch (error) {
      console.error("Signup error:", error);
      showGeneralError(mapAuthError(error));
    } finally {
      hideLoader();
      submitBtn.disabled = false;
    }
  });

  googleBtn.addEventListener("click", async () => {
    clearErrors();
    googleBtn.disabled = true;
    showLoader();
    try {
      await signInWithGoogle({ remember: true });
      showToast("Welcome to Zesto Print!", "success");
      navigateTo(VIEWS.HOME);
    } catch (error) {
      console.error("Google sign-in error:", error);
      showGeneralError(mapAuthError(error));
    } finally {
      hideLoader();
      googleBtn.disabled = false;
    }
  });
}

/* =========================================================
   PART 2 — FORGOT PASSWORD VIEW
========================================================= */
function initForgotPasswordView() {
  const form = document.getElementById("forgotForm");
  if (!form) return;

  const emailInput = document.getElementById("forgotEmail");
  const emailError = document.getElementById("forgotEmailError");
  const generalError = document.getElementById("forgotGeneralError");
  const generalErrorText = document.getElementById("forgotGeneralErrorText");
  const submitBtn = document.getElementById("forgotSubmit");
  const successBlock = document.getElementById("forgotSuccess");
  const successEmailEl = document.getElementById("forgotSuccessEmail");
  const resendBtn = document.getElementById("forgotResend");

  function clearErrors() {
    emailError.textContent = "";
    emailInput.classList.remove("zp-input--error");
    generalError.classList.remove("zp-auth__general-error--visible");
  }

  function setFieldError(input, errorEl, message) {
    input.classList.add("zp-input--error");
    errorEl.textContent = message;
  }

  function showGeneralError(message) {
    generalErrorText.textContent = message;
    generalError.classList.add("zp-auth__general-error--visible");
  }

  function validate() {
    const email = emailInput.value.trim();
    if (!email) {
      setFieldError(emailInput, emailError, "Email is required.");
      return false;
    }
    if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, "Enter a valid email address.");
      return false;
    }
    return true;
  }

  async function submitReset(email) {
    submitBtn.disabled = true;
    showLoader();
    try {
      await sendReset(email);
      successEmailEl.textContent = email;
      form.hidden = true;
      successBlock.classList.add("zp-auth__success--visible");
    } catch (error) {
      console.error("Password reset error:", error);
      if (error?.code === "auth/user-not-found") {
        // Don't reveal whether the account exists.
        successEmailEl.textContent = email;
        form.hidden = true;
        successBlock.classList.add("zp-auth__success--visible");
      } else {
        showGeneralError(mapAuthError(error));
      }
    } finally {
      hideLoader();
      submitBtn.disabled = false;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    if (!validate()) return;
    await submitReset(emailInput.value.trim());
  });

  resendBtn.addEventListener("click", async () => {
    const email = successEmailEl.textContent;
    if (email) await submitReset(email);
  });

  // Reset back to the form state whenever this view is (re)entered.
  onViewChange((view) => {
    if (view !== VIEWS.FORGOT_PASSWORD) return;
    form.reset();
    form.hidden = false;
    successBlock.classList.remove("zp-auth__success--visible");
    clearErrors();
  });
}

/* =========================================================
   PART 2 — HOME VIEW (placeholder controller — expands in Part 3)
========================================================= */
function initHomeView() {
  const logoutBtn = document.getElementById("homeLogoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    showLoader();
    try {
      await logoutUser();
      showToast("Logged out.", "info");
      navigateTo(VIEWS.LOGIN);
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Couldn't log out. Please try again.", "error");
    } finally {
      hideLoader();
    }
  });

  onViewChange((viewKey) => {
    if (viewKey === VIEWS.HOME) updateCartBadge();
  });
}

/* =========================================================
   PART 3 — CATALOG STATE + DATA FETCHING
   Categories and products are fetched once and cached in memory;
   search/sort/category filtering all happen client-side against
   that cache so the UI feels instant.
========================================================= */
const catalogState = {
  categories: [],
  products: [],
  categoriesLoaded: false,
  productsLoaded: false,
  selectedCategoryId: "",
  searchQuery: "",
  sortOrder: "newest"
};

// Static promotional content for the banner slider — this is marketing
// copy, not shop data, so it isn't a Firestore collection in this schema.
const BANNER_SLIDES = [
  {
    eyebrow: "New Arrival",
    title: "Custom T-Shirts, Printed in Days",
    cta: "Shop T-Shirts",
    colorClass: "zp-banner-slide--cyan"
  },
  {
    eyebrow: "Your Design, Your Way",
    title: "Upload Once. We Print It Perfectly.",
    cta: "Start Designing",
    colorClass: "zp-banner-slide--magenta"
  },
  {
    eyebrow: "Limited Time",
    title: "Bulk Orders Get Priority Printing",
    cta: "Learn More",
    colorClass: "zp-banner-slide--key"
  }
];

async function fetchCategories() {
  if (catalogState.categoriesLoaded) return catalogState.categories;
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.CATEGORIES), orderBy("name")));
  catalogState.categories = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  catalogState.categoriesLoaded = true;
  return catalogState.categories;
}

async function fetchProducts() {
  if (catalogState.productsLoaded) return catalogState.products;
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS), orderBy("createdAt", "desc"), limit(60)));
  catalogState.products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  catalogState.productsLoaded = true;
  return catalogState.products;
}

function getFilteredSortedProducts() {
  let list = [...catalogState.products];

  if (catalogState.selectedCategoryId) {
    list = list.filter((p) => p.categoryId === catalogState.selectedCategoryId);
  }

  if (catalogState.searchQuery) {
    const q = catalogState.searchQuery.toLowerCase();
    list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
  }

  switch (catalogState.sortOrder) {
    case "price-asc":
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case "price-desc":
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case "name-asc":
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    default:
      // "newest" — already sorted by createdAt desc from the query.
      break;
  }

  return list;
}

/* =========================================================
   PART 3 — RENDERING
========================================================= */
function renderBannerSlider() {
  const track = document.getElementById("bannerTrack");
  const dotsWrap = document.getElementById("bannerDots");
  if (!track || track.childElementCount > 0) return; // render once

  BANNER_SLIDES.forEach((slide) => {
    const slideEl = document.createElement("div");
    slideEl.className = `zp-banner-slide ${slide.colorClass}`;
    slideEl.innerHTML = `
      <span class="zp-banner-slide__eyebrow">${escapeHtml(slide.eyebrow)}</span>
      <h3 class="zp-banner-slide__title">${escapeHtml(slide.title)}</h3>
      <button type="button" class="zp-banner-slide__cta js-nav" data-view="categories">${escapeHtml(slide.cta)}</button>
    `;
    track.appendChild(slideEl);

    const dot = document.createElement("span");
    dot.className = "zp-banner-slider__dot";
    dotsWrap.appendChild(dot);
  });

  updateActiveDot();
  track.addEventListener("scroll", debounce(updateActiveDot, 100));

  // Auto-advance every 4.5s; pauses implicitly while the user is
  // actively scrolling because we always compute the *next* index
  // relative to whichever slide is currently in view.
  setInterval(() => {
    const dots = dotsWrap.querySelectorAll(".zp-banner-slider__dot");
    const activeIndex = [...dots].findIndex((d) => d.classList.contains("zp-banner-slider__dot--active"));
    const nextIndex = (activeIndex + 1) % BANNER_SLIDES.length;
    track.scrollTo({ left: track.clientWidth * nextIndex, behavior: "smooth" });
  }, 4500);
}

function updateActiveDot() {
  const track = document.getElementById("bannerTrack");
  const dotsWrap = document.getElementById("bannerDots");
  if (!track || !dotsWrap || track.clientWidth === 0) return;
  const index = Math.round(track.scrollLeft / track.clientWidth);
  dotsWrap.querySelectorAll(".zp-banner-slider__dot").forEach((dot, i) => {
    dot.classList.toggle("zp-banner-slider__dot--active", i === index);
  });
}

function renderHomeCategoryChips() {
  const row = document.getElementById("homeCategoryRow");
  if (!row) return;
  // Remove any previously injected chips (keep the static "All" chip).
  row.querySelectorAll("[data-injected]").forEach((el) => el.remove());

  catalogState.categories.forEach((cat) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "zp-category-chip";
    chip.dataset.categoryId = cat.id;
    chip.dataset.injected = "true";
    chip.innerHTML = `
      <span class="zp-category-chip__icon">${
        cat.imageURL ? `<img src="${escapeHtml(cat.imageURL)}" alt="" />` : "&#128230;"
      }</span>
      <span>${escapeHtml(cat.name || "Category")}</span>
    `;
    row.appendChild(chip);
  });
}

function renderCategoriesGrid() {
  const grid = document.getElementById("categoriesGrid");
  const empty = document.getElementById("categoriesEmpty");
  if (!grid) return;
  grid.innerHTML = "";

  if (catalogState.categories.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  catalogState.categories.forEach((cat) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "zp-card zp-card--interactive zp-category-card";
    card.dataset.categoryId = cat.id;
    card.innerHTML = `
      <span class="zp-reg-mark"><span class="zp-reg-mark-circle"></span></span>
      <span class="zp-category-card__icon">${
        cat.imageURL ? `<img src="${escapeHtml(cat.imageURL)}" alt="" />` : "&#128230;"
      }</span>
      <span>${escapeHtml(cat.name || "Category")}</span>
    `;
    card.addEventListener("click", () => {
      catalogState.selectedCategoryId = cat.id;
      navigateTo(VIEWS.HOME);
      renderProducts();
      syncActiveCategoryChip();
    });
    grid.appendChild(card);
  });
}

function syncActiveCategoryChip() {
  document.querySelectorAll(".zp-category-chip").forEach((chip) => {
    chip.classList.toggle("zp-category-chip--active", chip.dataset.categoryId === catalogState.selectedCategoryId);
  });
}

function renderProducts() {
  const grid = document.getElementById("homeProductGrid");
  const empty = document.getElementById("homeProductsEmpty");
  const countEl = document.getElementById("productsCount");
  if (!grid) return;

  const list = getFilteredSortedProducts();
  grid.innerHTML = "";
  countEl.textContent = list.length ? `${list.length} item${list.length === 1 ? "" : "s"}` : "";

  if (list.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.forEach((product) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "zp-card zp-card--interactive zp-product-card";
    card.dataset.productId = product.id;

    const imageHtml = product.imageURL
      ? `<img src="${escapeHtml(product.imageURL)}" alt="${escapeHtml(product.name || "")}" loading="lazy" />`
      : `<div class="zp-product-card__placeholder">ZP</div>`;

    card.innerHTML = `
      <span class="zp-reg-mark"><span class="zp-reg-mark-circle"></span></span>
      <div class="zp-product-card__image-wrap">${imageHtml}</div>
      <div class="zp-product-card__body">
        <span class="zp-product-card__name">${escapeHtml(product.name || "Untitled product")}</span>
        <div class="zp-product-card__meta">
          <span class="zp-product-card__price">${formatCurrency(product.price)}</span>
          ${product.rating ? `<span class="zp-badge zp-badge--yellow">&#9733; ${escapeHtml(String(product.rating))}</span>` : ""}
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      // Part 4 adds the "product-details" view; until then this is a
      // graceful no-op (see navigateTo's console warning).
      navigateTo(VIEWS.PRODUCT_DETAILS, { productId: product.id });
    });
    grid.appendChild(card);
  });
}

/* =========================================================
   PART 3 — HOME CATALOG CONTROLLER (search, sort, categories, products)
========================================================= */
function initHomeCatalog() {
  const searchInput = document.getElementById("homeSearchInput");
  const sortSelect = document.getElementById("homeSortSelect");
  const categoryRow = document.getElementById("homeCategoryRow");
  if (!searchInput) return;

  searchInput.addEventListener(
    "input",
    debounce((event) => {
      catalogState.searchQuery = event.target.value.trim();
      renderProducts();
    }, 250)
  );

  sortSelect.addEventListener("change", (event) => {
    catalogState.sortOrder = event.target.value;
    renderProducts();
  });

  categoryRow.addEventListener("click", (event) => {
    const chip = event.target.closest(".zp-category-chip");
    if (!chip) return;
    catalogState.selectedCategoryId = chip.dataset.categoryId || "";
    syncActiveCategoryChip();
    renderProducts();
  });

  let dataLoadedForHome = false;
  onViewChange(async (view) => {
    if (view !== VIEWS.HOME || dataLoadedForHome) return;
    renderBannerSlider();
    try {
      showLoader();
      await Promise.all([fetchCategories(), fetchProducts()]);
      dataLoadedForHome = true; // only lock in once the load actually succeeded
      renderHomeCategoryChips();
      renderProducts();
    } catch (error) {
      console.error("Error loading home catalog:", error);
      showToast("Couldn't load products right now.", "error");
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 3 — CATEGORIES VIEW CONTROLLER
========================================================= */
function initCategoriesView() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  let dataLoadedForCategories = false;
  onViewChange(async (view) => {
    if (view !== VIEWS.CATEGORIES || dataLoadedForCategories) return;
    try {
      showLoader();
      await fetchCategories();
      dataLoadedForCategories = true;
      renderCategoriesGrid();
    } catch (error) {
      console.error("Error loading categories:", error);
      showToast("Couldn't load categories right now.", "error");
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 4 — PRODUCT DETAILS STATE + DATA FETCHING
========================================================= */
const productDetailState = {
  productId: null,
  product: null,
  reviews: [],
  selectedColor: null,
  selectedSize: null,
  quantity: 1
};

async function fetchProductById(productId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

async function fetchProductReviews(productId) {
  // No orderBy here on purpose — avoids requiring a composite Firestore
  // index just for a product page; reviews are sorted client-side instead.
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.REVIEWS), where("productId", "==", productId), limit(20))
  );
  const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  reviews.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
  return reviews;
}

/* =========================================================
   PART 4 — PRODUCT DETAILS RENDERING
========================================================= */
function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images;
  if (product.imageURL) return [product.imageURL];
  return [];
}

function renderPdGallery(product) {
  const images = getProductImages(product);
  const mainEl = document.getElementById("pdGalleryMain");
  const thumbsEl = document.getElementById("pdGalleryThumbs");
  mainEl.innerHTML = "";
  thumbsEl.innerHTML = "";

  function setMain(url) {
    mainEl.innerHTML = url
      ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(product.name || "")}" />`
      : `<div class="zp-product-card__placeholder">ZP</div>`;
  }

  setMain(images[0] || null);

  if (images.length <= 1) return;

  images.forEach((url, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = `zp-pd-thumb${index === 0 ? " zp-pd-thumb--active" : ""}`;
    thumb.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
    thumb.addEventListener("click", () => {
      setMain(url);
      thumbsEl.querySelectorAll(".zp-pd-thumb").forEach((t) => t.classList.remove("zp-pd-thumb--active"));
      thumb.classList.add("zp-pd-thumb--active");
    });
    thumbsEl.appendChild(thumb);
  });
}

function renderPdColors(product) {
  const section = document.getElementById("pdColorSection");
  const row = document.getElementById("pdColorSwatches");
  const nameEl = document.getElementById("pdSelectedColorName");
  row.innerHTML = "";

  const colors = Array.isArray(product.colors) ? product.colors : [];
  if (colors.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  productDetailState.selectedColor = colors[0];
  nameEl.textContent = colors[0].name || "";

  colors.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `zp-swatch${index === 0 ? " zp-swatch--active" : ""}`;
    swatch.style.setProperty("background-color", color.hex || "#CCCCCC");
    swatch.setAttribute("aria-label", color.name || `Color ${index + 1}`);
    swatch.addEventListener("click", () => {
      productDetailState.selectedColor = color;
      nameEl.textContent = color.name || "";
      row.querySelectorAll(".zp-swatch").forEach((s) => s.classList.remove("zp-swatch--active"));
      swatch.classList.add("zp-swatch--active");
      updateLivePrice();
    });
    row.appendChild(swatch);
  });
}

function renderPdSizes(product) {
  const section = document.getElementById("pdSizeSection");
  const row = document.getElementById("pdSizeChips");
  const nameEl = document.getElementById("pdSelectedSizeName");
  row.innerHTML = "";

  const rawSizes = Array.isArray(product.sizes) ? product.sizes : [];
  // Sizes can be plain strings ("S","M","L") or { label, priceDelta } objects.
  const sizes = rawSizes.map((s) => (typeof s === "string" ? { label: s, priceDelta: 0 } : s));

  if (sizes.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  productDetailState.selectedSize = sizes[0];
  nameEl.textContent = sizes[0].label || "";

  sizes.forEach((size, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `zp-size-chip${index === 0 ? " zp-size-chip--active" : ""}`;
    chip.textContent = size.label || "";
    chip.addEventListener("click", () => {
      productDetailState.selectedSize = size;
      nameEl.textContent = size.label || "";
      row.querySelectorAll(".zp-size-chip").forEach((c) => c.classList.remove("zp-size-chip--active"));
      chip.classList.add("zp-size-chip--active");
      updateLivePrice();
    });
    row.appendChild(chip);
  });
}

function renderPdReviews(reviews) {
  const section = document.getElementById("pdReviewsSection");
  const list = document.getElementById("pdReviewsList");
  list.innerHTML = "";

  if (reviews.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  reviews.forEach((review) => {
    const item = document.createElement("div");
    item.className = "zp-review";
    const stars = "\u2605".repeat(clamp(Math.round(review.rating || 0), 0, 5));
    item.innerHTML = `
      <div class="zp-review__head">
        <span class="zp-review__author">${escapeHtml(review.authorName || "Zesto customer")}</span>
        <span class="zp-review__rating">${stars}</span>
      </div>
      <p class="zp-review__text">${escapeHtml(review.comment || "")}</p>
    `;
    list.appendChild(item);
  });
}

function updateLivePrice() {
  const product = productDetailState.product;
  if (!product) return;
  const basePrice = Number(product.price) || 0;
  const colorDelta = Number(productDetailState.selectedColor?.priceDelta) || 0;
  const sizeDelta = Number(productDetailState.selectedSize?.priceDelta) || 0;
  const unitPrice = basePrice + colorDelta + sizeDelta;
  const total = unitPrice * productDetailState.quantity;
  document.getElementById("pdLivePrice").textContent = formatCurrency(total);
  return { unitPrice, total };
}

function renderProductDetails(product) {
  document.getElementById("pdName").textContent = product.name || "Untitled product";
  document.getElementById("pdDescription").textContent = product.description || "";

  const category = catalogState.categories.find((c) => c.id === product.categoryId);
  document.getElementById("pdCategoryName").textContent = category ? category.name : "";

  const ratingEl = document.getElementById("pdRating");
  if (product.rating) {
    ratingEl.hidden = false;
    ratingEl.textContent = `\u2605 ${product.rating}${product.ratingCount ? ` (${product.ratingCount})` : ""}`;
  } else {
    ratingEl.hidden = true;
  }

  renderPdGallery(product);
  renderPdColors(product);
  renderPdSizes(product);

  productDetailState.quantity = 1;
  document.getElementById("pdQtyValue").textContent = "1";
  document.getElementById("pdQtyMinus").disabled = true;

  updateLivePrice();
}

/* =========================================================
   PART 4 — PRODUCT DETAILS CONTROLLER
========================================================= */
function initProductDetailsView() {
  const content = document.getElementById("productDetailsContent");
  const loading = document.getElementById("pdLoading");
  const bar = document.getElementById("pdBar");
  if (!content) return;

  const qtyMinus = document.getElementById("pdQtyMinus");
  const qtyPlus = document.getElementById("pdQtyPlus");
  const qtyValue = document.getElementById("pdQtyValue");
  const customizeBtn = document.getElementById("pdCustomizeBtn");

  const MAX_QTY = 20;

  qtyMinus.addEventListener("click", () => {
    productDetailState.quantity = clamp(productDetailState.quantity - 1, 1, MAX_QTY);
    qtyValue.textContent = String(productDetailState.quantity);
    qtyMinus.disabled = productDetailState.quantity <= 1;
    qtyPlus.disabled = productDetailState.quantity >= MAX_QTY;
    updateLivePrice();
  });

  qtyPlus.addEventListener("click", () => {
    productDetailState.quantity = clamp(productDetailState.quantity + 1, 1, MAX_QTY);
    qtyValue.textContent = String(productDetailState.quantity);
    qtyMinus.disabled = productDetailState.quantity <= 1;
    qtyPlus.disabled = productDetailState.quantity >= MAX_QTY;
    updateLivePrice();
  });

  customizeBtn.addEventListener("click", () => {
    const pricing = updateLivePrice();
    // Part 5 adds the "customize-product" view (upload design, live
    // preview). Selections made here travel with the navigation params
    // so that view can pick up right where this one left off.
    navigateTo(VIEWS.CUSTOMIZE_PRODUCT, {
      productId: productDetailState.productId,
      color: productDetailState.selectedColor,
      size: productDetailState.selectedSize,
      quantity: productDetailState.quantity,
      unitPrice: pricing?.unitPrice
    });
  });

  onViewChange(async (view, params) => {
    if (view !== VIEWS.PRODUCT_DETAILS) return;

    const productId = params?.productId;
    if (!productId) {
      showToast("No product selected.", "error");
      navigateTo(VIEWS.HOME);
      return;
    }

    content.hidden = true;
    bar.hidden = true;
    loading.hidden = false;

    try {
      showLoader();
      const [product, reviews] = await Promise.all([
        fetchProductById(productId),
        fetchProductReviews(productId)
      ]);

      if (!product) {
        showToast("This product is no longer available.", "error");
        navigateTo(VIEWS.HOME);
        return;
      }

      productDetailState.productId = productId;
      productDetailState.product = product;
      productDetailState.reviews = reviews;

      renderProductDetails(product);
      renderPdReviews(reviews);

      loading.hidden = true;
      content.hidden = false;
      bar.hidden = false;
    } catch (error) {
      console.error("Error loading product:", error);
      showToast("Couldn't load this product right now.", "error");
      navigateTo(VIEWS.HOME);
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 5 — CART STORAGE (client-side; there's no "cart" Firestore
   collection in this schema — checkout in Part 6 converts this into
   real orders/order_items documents).

   Scoped per-uid (not one shared key) so a shared family phone/device
   can't leak one account's cart into another account that logs in
   afterwards.
========================================================= */
function cartStorageKey() {
  const uid = auth.currentUser?.uid;
  return uid ? `zestoPrintCart_${uid}` : "zestoPrintCart_guest";
}

function updateCartBadge() {
  const badge = document.getElementById("cartNavBadge");
  if (!badge) return;
  const itemCount = getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  if (itemCount > 0) {
    badge.textContent = itemCount > 99 ? "99+" : String(itemCount);
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

function getCart() {
  try {
    const raw = localStorage.getItem(cartStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Error reading cart:", error);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(cartStorageKey(), JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart:", error);
  }
  updateCartBadge(); // single choke point — every mutation keeps the nav badge live
}

function addItemToCart(item) {
  const cart = getCart();
  cart.push({ ...item, cartItemId: `cart_${Date.now()}_${Math.floor(Math.random() * 1000)}` });
  saveCart(cart);
  return cart;
}

/* =========================================================
   PART 5 — CUSTOMIZE PRODUCT STATE
========================================================= */
function createEmptySideState() {
  return {
    file: null,
    previewURL: null,   // local object URL, shown immediately
    uploadedURL: null,  // Firebase Storage download URL, set once upload finishes
    storagePath: null,
    uploading: false,
    x: 0,      // px offset from stage center
    y: 0,
    scale: 1,
    rotation: 0 // degrees
  };
}

const customizeState = {
  productId: null,
  product: null,
  color: null,
  size: null,
  quantity: 1,
  unitPrice: 0,
  activeSide: "front",
  sides: {
    front: createEmptySideState(),
    back: createEmptySideState()
  }
};

/* =========================================================
   PART 5 — CUSTOMIZE PRODUCT RENDERING
========================================================= */
function getMockupImage(product, side) {
  if (side === "back" && product.mockupBack) return product.mockupBack;
  if (side === "front" && product.mockupFront) return product.mockupFront;
  const images = getProductImages(product);
  return images[0] || null;
}

function applyDesignTransform(sideState) {
  const layer = document.getElementById("cpDesignLayer");
  layer.style.transform =
    `translate(-50%, -50%) translate(${sideState.x}px, ${sideState.y}px) rotate(${sideState.rotation}deg) scale(${sideState.scale})`;
}

function renderCustomizeStage() {
  const side = customizeState.activeSide;
  const sideState = customizeState.sides[side];
  const mockupImg = document.getElementById("cpMockupImage");
  const uploadPrompt = document.getElementById("cpUploadPrompt");
  const designLayer = document.getElementById("cpDesignLayer");
  const designImg = document.getElementById("cpDesignImage");

  const mockupUrl = getMockupImage(customizeState.product, side);
  mockupImg.src = mockupUrl || "";
  mockupImg.style.visibility = mockupUrl ? "visible" : "hidden";

  if (sideState.previewURL) {
    uploadPrompt.hidden = true;
    designLayer.hidden = false;
    designImg.src = sideState.previewURL;
    applyDesignTransform(sideState);
  } else {
    uploadPrompt.hidden = false;
    designLayer.hidden = true;
  }

  document.getElementById("cpTabFront").classList.toggle("zp-side-tab--active", side === "front");
  document.getElementById("cpTabBack").classList.toggle("zp-side-tab--active", side === "back");
  document.getElementById("cpTabFront").setAttribute("aria-selected", String(side === "front"));
  document.getElementById("cpTabBack").setAttribute("aria-selected", String(side === "back"));
}

function renderCustomizeSummary() {
  const product = customizeState.product;
  document.getElementById("cpProductName").textContent = product?.name || "";
  document.getElementById("cpSummaryColor").textContent = customizeState.color?.name || "—";
  document.getElementById("cpSummarySize").textContent = customizeState.size?.label || "—";
  document.getElementById("cpSummaryQty").textContent = String(customizeState.quantity);
  const total = customizeState.unitPrice * customizeState.quantity;
  document.getElementById("cpLivePrice").textContent = formatCurrency(total);
}

/* =========================================================
   PART 5 — DESIGN UPLOAD (validation, Storage upload w/ progress)
========================================================= */
function handleDesignFileSelected(file) {
  const validation = validateDesignFile(file);
  if (!validation.valid) {
    showToast(validation.error, "error");
    return;
  }

  const side = customizeState.activeSide;
  const sideState = customizeState.sides[side];

  if (sideState.previewURL) URL.revokeObjectURL(sideState.previewURL);
  sideState.file = file;
  sideState.previewURL = URL.createObjectURL(file);
  sideState.uploadedURL = null;
  sideState.x = 0;
  sideState.y = 0;
  sideState.scale = 1;
  sideState.rotation = 0;

  renderCustomizeStage();
  uploadDesignFile(side, file);
}

function uploadDesignFile(side, file) {
  const sideState = customizeState.sides[side];
  const user = auth.currentUser;
  if (!user) {
    showToast("Please log in again to upload a design.", "error");
    return;
  }

  const progressWrap = document.getElementById("cpUploadProgress");
  const progressBar = document.getElementById("cpUploadProgressBar");
  const progressLabel = document.getElementById("cpUploadProgressLabel");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${STORAGE_PATHS.DESIGNS}/${user.uid}/${Date.now()}_${side}_${safeName}`;
  const fileRef = storageRef(storage, path);
  const task = uploadBytesResumable(fileRef, file);

  sideState.uploading = true;
  sideState.storagePath = path;
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  progressLabel.textContent = "Uploading\u2026";

  task.on(
    "state_changed",
    (snapshot) => {
      const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      progressBar.style.width = `${pct}%`;
      progressLabel.textContent = `Uploading\u2026 ${pct}%`;
    },
    (error) => {
      console.error("Design upload error:", error);
      sideState.uploading = false;
      progressWrap.hidden = true;
      showToast("Design upload failed. Please try again.", "error");
    },
    async () => {
      try {
        sideState.uploadedURL = await getDownloadURL(task.snapshot.ref);
        sideState.uploading = false;
        progressLabel.textContent = "Upload complete";
        setTimeout(() => (progressWrap.hidden = true), 900);
      } catch (error) {
        console.error("Error getting download URL:", error);
        sideState.uploading = false;
        progressWrap.hidden = true;
        showToast("Couldn't finish uploading your design.", "error");
      }
    }
  );
}

function removeCurrentSideDesign() {
  const side = customizeState.activeSide;
  const sideState = customizeState.sides[side];
  if (sideState.previewURL) URL.revokeObjectURL(sideState.previewURL);
  customizeState.sides[side] = createEmptySideState();
  renderCustomizeStage();
}

/* =========================================================
   PART 5 — MOVE / RESIZE / ROTATE (Pointer Events — works for
   mouse, touch, and pen with one code path)
========================================================= */
function initStageInteractions() {
  const stage = document.getElementById("cpStage");
  const designLayer = document.getElementById("cpDesignLayer");
  const resizeHandle = document.getElementById("cpResizeHandle");
  const rotateHandle = document.getElementById("cpRotateHandle");

  let dragMode = null; // "move" | "resize" | "rotate"
  let startPointer = { x: 0, y: 0 };
  let startState = null;
  let stageRect = null;

  function getSideState() {
    return customizeState.sides[customizeState.activeSide];
  }

  function stageCenter() {
    return { x: stageRect.left + stageRect.width / 2, y: stageRect.top + stageRect.height / 2 };
  }

  function onPointerDown(mode) {
    return (event) => {
      event.preventDefault();
      dragMode = mode;
      stageRect = stage.getBoundingClientRect();
      startPointer = { x: event.clientX, y: event.clientY };
      startState = { ...getSideState() };
      event.target.setPointerCapture?.(event.pointerId);
    };
  }

  function onPointerMove(event) {
    if (!dragMode) return;
    const sideState = getSideState();
    const dx = event.clientX - startPointer.x;
    const dy = event.clientY - startPointer.y;

    if (dragMode === "move") {
      const maxOffset = stageRect.width * 0.6;
      sideState.x = clamp(startState.x + dx, -maxOffset, maxOffset);
      sideState.y = clamp(startState.y + dy, -maxOffset, maxOffset);
    } else if (dragMode === "resize") {
      const center = stageCenter();
      const startDist = Math.hypot(
        startPointer.x - center.x - startState.x,
        startPointer.y - center.y - startState.y
      );
      const currentDist = Math.hypot(event.clientX - center.x - startState.x, event.clientY - center.y - startState.y);
      const ratio = startDist > 0 ? currentDist / startDist : 1;
      sideState.scale = clamp(startState.scale * ratio, 0.3, 3);
    } else if (dragMode === "rotate") {
      const center = { x: stageRect.left + stageRect.width / 2 + sideState.x, y: stageRect.top + stageRect.height / 2 + sideState.y };
      const startAngle = (Math.atan2(startPointer.y - center.y, startPointer.x - center.x) * 180) / Math.PI;
      const currentAngle = (Math.atan2(event.clientY - center.y, event.clientX - center.x) * 180) / Math.PI;
      sideState.rotation = Math.round(startState.rotation + (currentAngle - startAngle));
    }

    applyDesignTransform(sideState);
  }

  function onPointerUp() {
    dragMode = null;
    startState = null;
  }

  designLayer.addEventListener("pointerdown", (event) => {
    if (event.target === resizeHandle || event.target === rotateHandle) return;
    onPointerDown("move")(event);
  });
  resizeHandle.addEventListener("pointerdown", onPointerDown("resize"));
  rotateHandle.addEventListener("pointerdown", onPointerDown("rotate"));

  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerUp);
  stage.addEventListener("pointerleave", (event) => {
    // Only release if the pointer wasn't captured (captured pointers keep
    // firing move/up events even outside the element's bounds).
    if (dragMode && !event.target.hasPointerCapture?.(event.pointerId)) onPointerUp();
  });
}

/* =========================================================
   PART 5 — CUSTOMIZE PRODUCT CONTROLLER
========================================================= */
function initCustomizeProductView() {
  const view = document.getElementById("view-customize-product");
  if (!view) return;

  const tabFront = document.getElementById("cpTabFront");
  const tabBack = document.getElementById("cpTabBack");
  const fileInput = document.getElementById("cpFileInput");
  const removeBtn = document.getElementById("cpRemoveDesign");
  const addToCartBtn = document.getElementById("cpAddToCartBtn");

  initStageInteractions();

  tabFront.addEventListener("click", () => {
    customizeState.activeSide = "front";
    renderCustomizeStage();
  });
  tabBack.addEventListener("click", () => {
    customizeState.activeSide = "back";
    renderCustomizeStage();
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) handleDesignFileSelected(file);
    fileInput.value = "";
  });

  removeBtn.addEventListener("click", removeCurrentSideDesign);

  addToCartBtn.addEventListener("click", async () => {
    const frontState = customizeState.sides.front;
    if (!frontState.previewURL) {
      showToast("Please upload a design for the front side.", "error");
      return;
    }

    addToCartBtn.disabled = true;
    showLoader();
    try {
      // Wait for any still-in-progress uploads (rare, but possible if the
      // user taps Add to Cart immediately after choosing a file).
      let waited = 0;
      while ((customizeState.sides.front.uploading || customizeState.sides.back.uploading) && waited < 15000) {
        await sleep(300);
        waited += 300;
      }

      const designs = {};
      for (const side of ["front", "back"]) {
        const sideState = customizeState.sides[side];
        if (!sideState.previewURL) continue;
        if (!sideState.uploadedURL) {
          throw new Error(`${side} design upload did not finish. Please try again.`);
        }

        const designDocRef = await addDoc(collection(db, COLLECTIONS.DESIGN_UPLOADS), {
          uid: auth.currentUser.uid,
          productId: customizeState.productId,
          side,
          imageURL: sideState.uploadedURL,
          storagePath: sideState.storagePath,
          transform: { x: sideState.x, y: sideState.y, scale: sideState.scale, rotation: sideState.rotation },
          createdAt: serverTimestamp()
        });

        designs[side] = {
          designId: designDocRef.id,
          imageURL: sideState.uploadedURL,
          transform: { x: sideState.x, y: sideState.y, scale: sideState.scale, rotation: sideState.rotation }
        };
      }

      addItemToCart({
        productId: customizeState.productId,
        productName: customizeState.product?.name || "",
        productImage: getProductImages(customizeState.product)[0] || null,
        color: customizeState.color,
        size: customizeState.size,
        quantity: customizeState.quantity,
        unitPrice: customizeState.unitPrice,
        totalPrice: customizeState.unitPrice * customizeState.quantity,
        designs,
        addedAt: Date.now()
      });

      showToast("Added to cart!", "success");
      // Part 6 adds the "cart" view; until then this is a graceful no-op.
      navigateTo(VIEWS.CART);
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast(error.message || "Couldn't add this to your cart. Please try again.", "error");
    } finally {
      hideLoader();
      addToCartBtn.disabled = false;
    }
  });

  onViewChange(async (view, params) => {
    if (view !== VIEWS.CUSTOMIZE_PRODUCT) return;

    const productId = params?.productId;
    if (!productId) {
      showToast("No product selected.", "error");
      navigateTo(VIEWS.HOME);
      return;
    }

    // Fresh customization session each time this view is entered.
    Object.values(customizeState.sides).forEach((s) => {
      if (s.previewURL) URL.revokeObjectURL(s.previewURL);
    });
    customizeState.productId = productId;
    customizeState.color = params.color || null;
    customizeState.size = params.size || null;
    customizeState.quantity = params.quantity || 1;
    customizeState.unitPrice = params.unitPrice || 0;
    customizeState.activeSide = "front";
    customizeState.sides = { front: createEmptySideState(), back: createEmptySideState() };

    try {
      showLoader();
      const product =
        productDetailState.product?.id === productId ? productDetailState.product : await fetchProductById(productId);
      if (!product) {
        showToast("This product is no longer available.", "error");
        navigateTo(VIEWS.HOME);
        return;
      }
      customizeState.product = product;
      renderCustomizeStage();
      renderCustomizeSummary();
    } catch (error) {
      console.error("Error loading product for customization:", error);
      showToast("Couldn't load this product right now.", "error");
      navigateTo(VIEWS.HOME);
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 6 — CART TOTALS
========================================================= */
const SHIPPING_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 999;

function computeCartTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const shipping = cart.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const itemCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  return { subtotal, shipping, total, itemCount };
}

function removeCartItem(cartItemId) {
  const cart = getCart().filter((item) => item.cartItemId !== cartItemId);
  saveCart(cart);
  renderCart();
}

function updateCartItemQty(cartItemId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.cartItemId === cartItemId);
  if (!item) return;
  item.quantity = clamp((Number(item.quantity) || 1) + delta, 1, 20);
  item.totalPrice = item.quantity * (Number(item.unitPrice) || 0);
  saveCart(cart);
  renderCart();
}

function clearCart() {
  saveCart([]);
  renderCart();
}

/* =========================================================
   PART 6 — CART RENDERING
========================================================= */
function renderCart() {
  const cart = getCart();
  const listEl = document.getElementById("cartList");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  const barEl = document.getElementById("cartBar");
  const clearBtn = document.getElementById("cartClearBtn");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (cart.length === 0) {
    emptyEl.hidden = false;
    summaryEl.hidden = true;
    barEl.hidden = true;
    clearBtn.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  summaryEl.hidden = false;
  barEl.hidden = false;
  clearBtn.hidden = false;

  cart.forEach((item) => {
    const el = document.createElement("div");
    el.className = "zp-cart-item";
    const thumb = item.designs?.front?.imageURL || item.productImage;
    el.innerHTML = `
      ${thumb
        ? `<img class="zp-cart-item__image" src="${escapeHtml(thumb)}" alt="${escapeHtml(item.productName)}" />`
        : `<div class="zp-cart-item__image zp-center">ZP</div>`}
      <div class="zp-cart-item__body">
        <span class="zp-cart-item__name">${escapeHtml(item.productName)}</span>
        <span class="zp-cart-item__meta">${escapeHtml(item.color?.name || "")}${item.color && item.size ? " \u00B7 " : ""}${escapeHtml(item.size?.label || "")}</span>
        <div class="zp-cart-item__footer">
          <div class="zp-cart-item__qty">
            <button type="button" data-action="dec" aria-label="Decrease quantity">&#8722;</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="inc" aria-label="Increase quantity">&#43;</button>
          </div>
          <span class="zp-cart-item__price">${formatCurrency(item.totalPrice)}</span>
        </div>
      </div>
    `;

    el.querySelector('[data-action="dec"]').addEventListener("click", () => updateCartItemQty(item.cartItemId, -1));
    el.querySelector('[data-action="inc"]').addEventListener("click", () => updateCartItemQty(item.cartItemId, 1));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "zp-cart-item__remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeCartItem(item.cartItemId));
    el.querySelector(".zp-cart-item__body").appendChild(removeBtn);

    listEl.appendChild(el);
  });

  const totals = computeCartTotals(cart);
  document.getElementById("cartSubtotal").textContent = formatCurrency(totals.subtotal);
  document.getElementById("cartShipping").textContent = totals.shipping === 0 ? "FREE" : formatCurrency(totals.shipping);
  document.getElementById("cartTotal").textContent = formatCurrency(totals.total);
  document.getElementById("cartBarTotal").textContent = formatCurrency(totals.total);
  document.getElementById("cartItemCount").textContent = `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}`;
}

/* =========================================================
   PART 6 — CART CONTROLLER
========================================================= */
function initCartView() {
  const view = document.getElementById("view-cart");
  if (!view) return;

  document.getElementById("cartClearBtn").addEventListener("click", () => {
    clearCart();
    showToast("Cart cleared.", "info");
  });

  onViewChange((viewKey) => {
    if (viewKey !== VIEWS.CART) return;
    renderCart();
  });
}

/* =========================================================
   PART 6 — ADDRESSES
========================================================= */
const checkoutState = {
  addresses: [],
  selectedAddressId: null
};

async function fetchAddresses(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.ADDRESSES), where("uid", "==", uid)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function addAddress(uid, data) {
  const docRef = await addDoc(collection(db, COLLECTIONS.ADDRESSES), {
    uid,
    ...data,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, uid, ...data };
}

function renderAddressList() {
  const listEl = document.getElementById("checkoutAddressList");
  const noAddrEl = document.getElementById("checkoutNoAddress");
  listEl.innerHTML = "";

  if (checkoutState.addresses.length === 0) {
    noAddrEl.hidden = false;
    return;
  }
  noAddrEl.hidden = true;

  if (!checkoutState.selectedAddressId) {
    checkoutState.selectedAddressId = checkoutState.addresses[0].id;
  }

  checkoutState.addresses.forEach((addr) => {
    const isActive = addr.id === checkoutState.selectedAddressId;
    const label = document.createElement("label");
    label.className = `zp-address-option${isActive ? " zp-address-option--active" : ""}`;
    label.innerHTML = `
      <input type="radio" name="deliveryAddress" value="${addr.id}" ${isActive ? "checked" : ""} />
      <span>
        <span class="zp-address-option__name">${escapeHtml(addr.fullName)} &middot; ${escapeHtml(addr.phone)}</span>
        <span class="zp-address-option__detail">${escapeHtml(addr.line1)}${addr.line2 ? ", " + escapeHtml(addr.line2) : ""}, ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.pincode)}</span>
      </span>
    `;
    label.querySelector("input").addEventListener("change", () => {
      checkoutState.selectedAddressId = addr.id;
      renderAddressList();
    });
    listEl.appendChild(label);
  });
}

/* =========================================================
   PART 6 — CHECKOUT ORDER SUMMARY
========================================================= */
function renderCheckoutSummary() {
  const cart = getCart();
  const itemsEl = document.getElementById("checkoutItems");
  itemsEl.innerHTML = cart
    .map(
      (item) => `
      <div class="zp-checkout-item">
        <span class="zp-checkout-item__name">${escapeHtml(item.productName)} &times; ${item.quantity}</span>
        <span class="zp-checkout-item__price">${formatCurrency(item.totalPrice)}</span>
      </div>`
    )
    .join("");

  const totals = computeCartTotals(cart);
  document.getElementById("checkoutSubtotal").textContent = formatCurrency(totals.subtotal);
  document.getElementById("checkoutShipping").textContent = totals.shipping === 0 ? "FREE" : formatCurrency(totals.shipping);
  document.getElementById("checkoutTotal").textContent = formatCurrency(totals.total);
  document.getElementById("checkoutBarTotal").textContent = formatCurrency(totals.total);
}

/* =========================================================
   PART 6 — CHECKOUT CONTROLLER
========================================================= */
function initCheckoutView() {
  const view = document.getElementById("view-checkout");
  if (!view) return;

  const addAddressBtn = document.getElementById("checkoutAddAddressBtn");
  const addressForm = document.getElementById("checkoutAddressForm");
  const addressList = document.getElementById("checkoutAddressList");
  const cancelBtn = document.getElementById("addrCancelBtn");
  const saveBtn = document.getElementById("addrSaveBtn");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  const fields = {
    fullName: document.getElementById("addrFullName"),
    phone: document.getElementById("addrPhone"),
    line1: document.getElementById("addrLine1"),
    line2: document.getElementById("addrLine2"),
    city: document.getElementById("addrCity"),
    state: document.getElementById("addrState"),
    pincode: document.getElementById("addrPincode")
  };
  const errors = {
    fullName: document.getElementById("addrFullNameError"),
    phone: document.getElementById("addrPhoneError"),
    line1: document.getElementById("addrLine1Error"),
    city: document.getElementById("addrCityError"),
    state: document.getElementById("addrStateError"),
    pincode: document.getElementById("addrPincodeError")
  };

  function clearAddressErrors() {
    Object.values(errors).forEach((el) => (el.textContent = ""));
    Object.values(fields).forEach((el) => el.classList.remove("zp-input--error"));
  }

  function toggleForm(show) {
    addressForm.hidden = !show;
    addressList.hidden = show;
    addAddressBtn.hidden = show;
  }

  addAddressBtn.addEventListener("click", () => {
    clearAddressErrors();
    addressForm.reset();
    toggleForm(true);
  });

  cancelBtn.addEventListener("click", () => toggleForm(false));

  addressForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAddressErrors();

    let valid = true;
    if (!fields.fullName.value.trim()) {
      fields.fullName.classList.add("zp-input--error");
      errors.fullName.textContent = "Full name is required.";
      valid = false;
    }
    if (!isValidPhone(fields.phone.value.trim())) {
      fields.phone.classList.add("zp-input--error");
      errors.phone.textContent = "Enter a valid 10-digit mobile number.";
      valid = false;
    }
    if (!fields.line1.value.trim()) {
      fields.line1.classList.add("zp-input--error");
      errors.line1.textContent = "Address is required.";
      valid = false;
    }
    if (!fields.city.value.trim()) {
      fields.city.classList.add("zp-input--error");
      errors.city.textContent = "City is required.";
      valid = false;
    }
    if (!fields.state.value.trim()) {
      fields.state.classList.add("zp-input--error");
      errors.state.textContent = "State is required.";
      valid = false;
    }
    if (!isValidPincode(fields.pincode.value.trim())) {
      fields.pincode.classList.add("zp-input--error");
      errors.pincode.textContent = "Enter a valid 6-digit pincode.";
      valid = false;
    }
    if (!valid) return;

    saveBtn.disabled = true;
    showLoader();
    try {
      const newAddress = await addAddress(auth.currentUser.uid, {
        fullName: fields.fullName.value.trim(),
        phone: fields.phone.value.trim(),
        line1: fields.line1.value.trim(),
        line2: fields.line2.value.trim(),
        city: fields.city.value.trim(),
        state: fields.state.value.trim(),
        pincode: fields.pincode.value.trim()
      });
      checkoutState.addresses.unshift(newAddress);
      checkoutState.selectedAddressId = newAddress.id;
      renderAddressList();
      toggleForm(false);
      showToast("Address saved.", "success");
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("Couldn't save this address. Please try again.", "error");
    } finally {
      hideLoader();
      saveBtn.disabled = false;
    }
  });

  placeOrderBtn.addEventListener("click", async () => {
    const cart = getCart();
    if (cart.length === 0) {
      showToast("Your cart is empty.", "error");
      navigateTo(VIEWS.CART);
      return;
    }
    if (!checkoutState.selectedAddressId) {
      showToast("Please add or select a delivery address.", "error");
      return;
    }

    const address = checkoutState.addresses.find((a) => a.id === checkoutState.selectedAddressId);
    const totals = computeCartTotals(cart);
    const orderNumber = generateOrderNumber();
    const user = auth.currentUser;

    placeOrderBtn.disabled = true;
    showLoader();
    try {
      const orderRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
        uid: user.uid,
        orderNumber,
        status: ORDER_STATUS.PLACED,
        statusHistory: [{ status: ORDER_STATUS.PLACED, at: Date.now() }],
        address,
        paymentMethod: "cod",
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        itemCount: totals.itemCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await Promise.all(
        cart.map((item) =>
          addDoc(collection(db, COLLECTIONS.ORDER_ITEMS), {
            orderId: orderRef.id,
            uid: user.uid,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            designs: item.designs,
            createdAt: serverTimestamp()
          })
        )
      );

      clearCart();
      showToast("Order placed!", "success");
      navigateTo(VIEWS.ORDER_SUCCESS, { orderId: orderRef.id, orderNumber });
    } catch (error) {
      console.error("Error placing order:", error);
      showToast("Couldn't place your order. Please try again.", "error");
    } finally {
      hideLoader();
      placeOrderBtn.disabled = false;
    }
  });

  onViewChange(async (viewKey) => {
    if (viewKey !== VIEWS.CHECKOUT) return;

    const cart = getCart();
    if (cart.length === 0) {
      showToast("Your cart is empty.", "error");
      navigateTo(VIEWS.CART);
      return;
    }

    renderCheckoutSummary();
    toggleForm(false);

    const user = auth.currentUser;
    if (!user) return;

    try {
      showLoader();
      checkoutState.addresses = await fetchAddresses(user.uid);
      checkoutState.selectedAddressId = checkoutState.addresses[0]?.id || null;
      renderAddressList();
    } catch (error) {
      console.error("Error loading addresses:", error);
      showToast("Couldn't load your saved addresses.", "error");
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 6 — ORDER SUCCESS CONTROLLER
========================================================= */
function initOrderSuccessView() {
  const view = document.getElementById("view-order-success");
  if (!view) return;

  const trackBtn = document.getElementById("orderSuccessTrackBtn");
  let lastOrderId = null;

  trackBtn.addEventListener("click", () => {
    // Part 7 adds the "order-tracking" view; graceful no-op until then.
    navigateTo(VIEWS.ORDER_TRACKING, { orderId: lastOrderId });
  });

  onViewChange((viewKey, params) => {
    if (viewKey !== VIEWS.ORDER_SUCCESS) return;
    lastOrderId = params?.orderId || null;
    document.getElementById("orderSuccessNumber").textContent = params?.orderNumber || "";
  });
}

/* =========================================================
   PART 7 — ORDER TRACKING
========================================================= */
async function fetchOrderById(orderId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

async function fetchOrderItems(orderId) {
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.ORDER_ITEMS), where("orderId", "==", orderId)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderOrderTimeline(order) {
  const timelineEl = document.getElementById("trackTimeline");
  const cancelledBanner = document.getElementById("trackTimelineCancelled");
  timelineEl.innerHTML = "";

  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  cancelledBanner.hidden = !isCancelled;

  const currentIndex = ORDER_STATUS_FLOW.findIndex((s) => s.key === order.status);
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  ORDER_STATUS_FLOW.forEach((step, index) => {
    let state = "pending";
    if (!isCancelled) {
      if (index < currentIndex) state = "done";
      else if (index === currentIndex) state = "current";
    } else {
      state = index === 0 ? "done" : "pending";
    }

    const historyEntry = history.find((h) => h.status === step.key);
    const el = document.createElement("div");
    el.className = `zp-timeline__step zp-timeline__step--${state}`;
    el.innerHTML = `
      <span class="zp-timeline__dot">${state === "done" || state === "current" ? "\u2713" : ""}</span>
      <div>
        <div class="zp-timeline__label">${escapeHtml(step.label)}</div>
        ${historyEntry ? `<div class="zp-timeline__time">${escapeHtml(formatDate(historyEntry.at))}</div>` : ""}
      </div>
    `;
    timelineEl.appendChild(el);
  });
}

function renderOrderTracking(order, items) {
  document.getElementById("trackOrderNumber").textContent = order.orderNumber || "";
  document.getElementById("trackOrderDate").textContent = `Placed ${formatDate(order.createdAt)}`;

  const statusBadge = document.getElementById("trackOrderStatusBadge");
  const statusMeta = ORDER_STATUS_FLOW.find((s) => s.key === order.status);
  statusBadge.textContent = order.status === ORDER_STATUS.CANCELLED ? "Cancelled" : statusMeta?.label || order.status;
  statusBadge.className = `zp-badge ${order.status === ORDER_STATUS.CANCELLED ? "zp-badge--danger" : "zp-badge--cyan"}`;

  renderOrderTimeline(order);

  const itemsEl = document.getElementById("trackItems");
  itemsEl.innerHTML = items
    .map(
      (item) => `
      <div class="zp-checkout-item">
        <span class="zp-checkout-item__name">${escapeHtml(item.productName)} &times; ${item.quantity}</span>
        <span class="zp-checkout-item__price">${formatCurrency(item.totalPrice)}</span>
      </div>`
    )
    .join("");

  const addr = order.address;
  document.getElementById("trackAddress").textContent = addr
    ? `${addr.fullName}, ${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}, ${addr.city}, ${addr.state} - ${addr.pincode} \u00B7 ${addr.phone}`
    : "";
}

function initOrderTrackingView() {
  const view = document.getElementById("view-order-tracking");
  if (!view) return;

  const content = document.getElementById("trackingContent");
  const emptyEl = document.getElementById("trackingEmpty");

  onViewChange(async (viewKey, params) => {
    if (viewKey !== VIEWS.ORDER_TRACKING) return;

    const orderId = params?.orderId;
    content.hidden = true;
    emptyEl.hidden = true;

    if (!orderId) {
      emptyEl.hidden = false;
      return;
    }

    try {
      showLoader();
      const [order, items] = await Promise.all([fetchOrderById(orderId), fetchOrderItems(orderId)]);
      if (!order) {
        emptyEl.hidden = false;
        return;
      }
      renderOrderTracking(order, items);
      content.hidden = false;
    } catch (error) {
      console.error("Error loading order:", error);
      showToast("Couldn't load this order right now.", "error");
      emptyEl.hidden = false;
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 7 — ORDER HISTORY
========================================================= */
async function fetchUserOrders(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.ORDERS), where("uid", "==", uid)));
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  orders.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
  return orders;
}

function renderOrdersList(orders) {
  const listEl = document.getElementById("ordersList");
  const emptyEl = document.getElementById("ordersEmpty");
  listEl.innerHTML = "";

  if (orders.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  orders.forEach((order) => {
    const statusMeta = ORDER_STATUS_FLOW.find((s) => s.key === order.status);
    const statusLabel = order.status === ORDER_STATUS.CANCELLED ? "Cancelled" : statusMeta?.label || order.status;
    const card = document.createElement("div");
    card.className = "zp-order-card";
    card.innerHTML = `
      <div class="zp-order-card__head">
        <div>
          <div class="zp-order-card__number">${escapeHtml(order.orderNumber || "")}</div>
          <div class="zp-order-card__date">${escapeHtml(formatDate(order.createdAt))}</div>
        </div>
        <span class="zp-badge ${order.status === ORDER_STATUS.CANCELLED ? "zp-badge--danger" : "zp-badge--cyan"}">${escapeHtml(statusLabel)}</span>
      </div>
      <div class="zp-order-card__footer">
        <span class="zp-text-sm zp-text-muted">${order.itemCount || 0} item${order.itemCount === 1 ? "" : "s"}</span>
        <span class="zp-order-card__total">${formatCurrency(order.total)}</span>
      </div>
    `;
    card.addEventListener("click", () => navigateTo(VIEWS.ORDER_TRACKING, { orderId: order.id }));
    listEl.appendChild(card);
  });
}

function initOrdersView() {
  const view = document.getElementById("view-orders");
  if (!view) return;

  onViewChange(async (viewKey) => {
    if (viewKey !== VIEWS.ORDERS) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      showLoader();
      const orders = await fetchUserOrders(user.uid);
      renderOrdersList(orders);
    } catch (error) {
      console.error("Error loading orders:", error);
      showToast("Couldn't load your orders right now.", "error");
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 7 — NOTIFICATIONS
   Broadcast notifications (uid == "all") can't have a shared "read"
   flag in Firestore without every user fighting over the same
   document, so broadcast read-state is tracked per-device in
   localStorage; personal notifications (uid == the user's own)
   update their own Firestore doc directly, which is safe since only
   that user can ever read or write it.
========================================================= */
function getLocalReadBroadcastIds(uid) {
  try {
    const raw = localStorage.getItem(`zestoPrintReadBroadcasts_${uid}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markBroadcastReadLocally(uid, notificationId) {
  const ids = getLocalReadBroadcastIds(uid);
  ids.add(notificationId);
  localStorage.setItem(`zestoPrintReadBroadcasts_${uid}`, JSON.stringify([...ids]));
}

async function fetchNotifications(uid) {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.NOTIFICATIONS), where("uid", "in", [uid, "all"]), limit(50))
  );
  const notifications = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  notifications.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
  return notifications;
}

function isNotificationRead(notification, localReadIds) {
  return notification.uid === "all" ? localReadIds.has(notification.id) : Boolean(notification.read);
}

async function markNotificationRead(notification, localReadIds) {
  if (notification.uid === "all") {
    markBroadcastReadLocally(auth.currentUser.uid, notification.id);
  } else {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notification.id), { read: true });
  }
}

function renderNotifications(notifications, localReadIds) {
  const listEl = document.getElementById("notificationsList");
  const emptyEl = document.getElementById("notificationsEmpty");
  listEl.innerHTML = "";

  if (notifications.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  notifications.forEach((n) => {
    const read = isNotificationRead(n, localReadIds);
    const el = document.createElement("div");
    el.className = `zp-notification${read ? "" : " zp-notification--unread"}`;
    el.innerHTML = `
      <span class="zp-notification__dot"></span>
      <div>
        <div class="zp-notification__title">${escapeHtml(n.title || "Zesto Print")}</div>
        <div class="zp-notification__body">${escapeHtml(n.body || "")}</div>
        <div class="zp-notification__time">${escapeHtml(timeAgo(n.createdAt))}</div>
      </div>
    `;
    el.addEventListener("click", async () => {
      if (isNotificationRead(n, localReadIds)) return;
      await markNotificationRead(n, localReadIds);
      el.classList.remove("zp-notification--unread");
    });
    listEl.appendChild(el);
  });
}

function initNotificationsView() {
  const view = document.getElementById("view-notifications");
  if (!view) return;

  onViewChange(async (viewKey) => {
    if (viewKey !== VIEWS.NOTIFICATIONS) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      showLoader();
      const notifications = await fetchNotifications(user.uid);
      const localReadIds = getLocalReadBroadcastIds(user.uid);
      renderNotifications(notifications, localReadIds);
    } catch (error) {
      console.error("Error loading notifications:", error);
      showToast("Couldn't load notifications right now.", "error");
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 7 — PROFILE
========================================================= */
function getInitials(name) {
  if (!name) return "ZP";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return initials.join("") || "ZP";
}

async function fetchUserProfile(uid) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snapshot.exists() ? snapshot.data() : null;
}

function renderProfileHeader(user, profile) {
  const name = profile?.fullName || user.displayName || "Zesto customer";
  document.getElementById("profileAvatar").textContent = getInitials(name);
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = user.email || "";
  document.getElementById("profileViewName").textContent = name;
  document.getElementById("profileViewPhone").textContent = profile?.phone || "—";
}

function renderProfileAddresses(addresses) {
  const listEl = document.getElementById("profileAddressList");
  const emptyEl = document.getElementById("profileNoAddress");
  listEl.innerHTML = "";

  if (addresses.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  addresses.forEach((addr) => {
    const el = document.createElement("div");
    el.className = "zp-profile-address-item";
    el.innerHTML = `
      <span>
        <span class="zp-address-option__name">${escapeHtml(addr.fullName)} &middot; ${escapeHtml(addr.phone)}</span><br/>
        <span class="zp-address-option__detail">${escapeHtml(addr.line1)}${addr.line2 ? ", " + escapeHtml(addr.line2) : ""}, ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.pincode)}</span>
      </span>
      <button type="button" class="zp-profile-address-item__delete">Delete</button>
    `;
    el.querySelector("button").addEventListener("click", async () => {
      try {
        showLoader();
        await deleteDoc(doc(db, COLLECTIONS.ADDRESSES, addr.id));
        el.remove();
        showToast("Address removed.", "info");
        if (listEl.children.length === 0) emptyEl.hidden = false;
      } catch (error) {
        console.error("Error deleting address:", error);
        showToast("Couldn't remove this address.", "error");
      } finally {
        hideLoader();
      }
    });
    listEl.appendChild(el);
  });
}

function initProfileView() {
  const view = document.getElementById("view-profile");
  if (!view) return;

  const editToggle = document.getElementById("profileEditToggle");
  const editForm = document.getElementById("profileEditForm");
  const editView = document.getElementById("profileView");
  const editCancel = document.getElementById("profileEditCancel");
  const editSave = document.getElementById("profileEditSave");
  const nameInput = document.getElementById("profileEditName");
  const phoneInput = document.getElementById("profileEditPhone");
  const nameError = document.getElementById("profileEditNameError");
  const phoneError = document.getElementById("profileEditPhoneError");
  const logoutBtn = document.getElementById("profileLogoutBtn");

  let currentProfile = null;

  function toggleEdit(show) {
    editForm.hidden = !show;
    editView.hidden = show;
    editToggle.hidden = show;
    if (show) {
      nameInput.value = currentProfile?.fullName || auth.currentUser?.displayName || "";
      phoneInput.value = currentProfile?.phone || "";
      nameError.textContent = "";
      phoneError.textContent = "";
    }
  }

  editToggle.addEventListener("click", () => toggleEdit(true));
  editCancel.addEventListener("click", () => toggleEdit(false));

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    nameError.textContent = "";
    phoneError.textContent = "";

    let valid = true;
    if (!nameInput.value.trim()) {
      nameError.textContent = "Full name is required.";
      valid = false;
    }
    if (!isValidPhone(phoneInput.value.trim())) {
      phoneError.textContent = "Enter a valid 10-digit mobile number.";
      valid = false;
    }
    if (!valid) return;

    editSave.disabled = true;
    showLoader();
    try {
      const fullName = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      await updateDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
        fullName,
        phone,
        updatedAt: serverTimestamp()
      });
      await updateProfile(auth.currentUser, { displayName: fullName });
      currentProfile = { ...currentProfile, fullName, phone };
      renderProfileHeader(auth.currentUser, currentProfile);
      toggleEdit(false);
      showToast("Profile updated.", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Couldn't update your profile. Please try again.", "error");
    } finally {
      hideLoader();
      editSave.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    showLoader();
    try {
      await logoutUser();
      showToast("Logged out.", "info");
      navigateTo(VIEWS.LOGIN);
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Couldn't log out. Please try again.", "error");
    } finally {
      hideLoader();
    }
  });

  onViewChange(async (viewKey) => {
    if (viewKey !== VIEWS.PROFILE) return;
    const user = auth.currentUser;
    if (!user) return;

    toggleEdit(false);
    try {
      showLoader();
      const [profile, addresses] = await Promise.all([fetchUserProfile(user.uid), fetchAddresses(user.uid)]);
      currentProfile = profile;
      renderProfileHeader(user, profile);
      renderProfileAddresses(addresses);
    } catch (error) {
      console.error("Error loading profile:", error);
      showToast("Couldn't load your profile right now.", "error");
    } finally {
      hideLoader();
    }
  });
}

/* =========================================================
   PART 2 — ONGOING AUTH GUARD
   Beyond the initial splash routing, keep watching auth state so a
   session ending mid-use (token expiry, logout in another tab, etc.)
   also bounces the user back to Login — not just on first load.
========================================================= */
const PUBLIC_VIEWS = [VIEWS.SPLASH, VIEWS.LOGIN, VIEWS.SIGNUP, VIEWS.FORGOT_PASSWORD];

function startAuthGuard() {
  onAuthStateChanged(auth, (user) => {
    if (!user && currentView && !PUBLIC_VIEWS.includes(currentView)) {
      navigateTo(VIEWS.LOGIN);
    }
  });
}

/* =========================================================
   PART 1 — APP BOOTSTRAP
   (Part 2 adds view controller init calls + the auth guard here)
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initLoginView();
  initSignupView();
  initForgotPasswordView();
  initHomeView();
  initHomeCatalog();
  initCategoriesView();
  initProductDetailsView();
  initCustomizeProductView();
  initCartView();
  initCheckoutView();
  initOrderSuccessView();
  initOrderTrackingView();
  initOrdersView();
  initNotificationsView();
  initProfileView();
  startAuthGuard();
  bootSplash();
});

/* Further parts append their controllers below this line. */
