// customer-app/js/constants.js
// Single source of truth for collection names, storage paths, and app-wide config.
// Never hardcode a collection name or path string anywhere else — import from here.

export const COLLECTIONS = {
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

export const STORAGE_PATHS = {
  PRODUCTS: "products",
  DESIGNS: "designs",
  USERS: "users"
};

export const ORDER_STATUS = {
  PLACED: "placed",
  CONFIRMED: "confirmed",
  PRINTING: "printing",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

// Human-readable labels + the order they appear in on the tracking timeline.
export const ORDER_STATUS_FLOW = [
  { key: ORDER_STATUS.PLACED, label: "Order Placed" },
  { key: ORDER_STATUS.CONFIRMED, label: "Confirmed" },
  { key: ORDER_STATUS.PRINTING, label: "Printing" },
  { key: ORDER_STATUS.PACKED, label: "Packed" },
  { key: ORDER_STATUS.SHIPPED, label: "Shipped" },
  { key: ORDER_STATUS.OUT_FOR_DELIVERY, label: "Out for Delivery" },
  { key: ORDER_STATUS.DELIVERED, label: "Delivered" }
];

export const DESIGN_UPLOAD_RULES = {
  ALLOWED_TYPES: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
  ALLOWED_EXTENSIONS: [".png", ".jpg", ".jpeg", ".pdf"],
  MAX_SIZE_BYTES: 25 * 1024 * 1024 // 25 MB
};

export const CURRENCY = {
  CODE: "INR",
  SYMBOL: "\u20B9",
  LOCALE: "en-IN"
};

export const APP_CONFIG = {
  NAME: "Zesto Print",
  TAGLINE: "Your Design. Printed Perfectly.",
  SUPPORT_PHONE: "+91-XXXXXXXXXX",
  SUPPORT_EMAIL: "support@zestoprint.in",
  DEFAULT_COUNTRY: "India"
};

export const ROUTES = {
  SPLASH: "/pages/splash.html",
  LOGIN: "/pages/login.html",
  SIGNUP: "/pages/signup.html",
  FORGOT_PASSWORD: "/pages/forgot-password.html",
  HOME: "/pages/home.html",
  CATEGORIES: "/pages/categories.html",
  PRODUCT_LIST: "/pages/product-list.html",
  PRODUCT_DETAILS: "/pages/product-details.html",
  CUSTOMIZE_PRODUCT: "/pages/customize-product.html",
  CART: "/pages/cart.html",
  CHECKOUT: "/pages/checkout.html",
  ORDER_SUCCESS: "/pages/order-success.html",
  ORDER_TRACKING: "/pages/order-tracking.html",
  ORDERS: "/pages/orders.html",
  PROFILE: "/pages/profile.html",
  ADDRESSES: "/pages/addresses.html",
  NOTIFICATIONS: "/pages/notifications.html",
  SUPPORT: "/pages/support.html"
};
