# Zesto Print — Customer App

Single-vendor Print-on-Demand customer app. Upload a design → we print it,
pack it, ship it, and you track it.

Stack: HTML5, CSS3, Vanilla JS (ES6 modules), Firebase (Auth, Firestore, Storage).
No frameworks, no build step — open any `.html` file through a static server and it runs.

## Folder structure

```
customer-app/
├── assets/       icons, static SVGs etc.
├── css/          variables.css, global.css, components.css + one file per page
├── js/           constants.js, utils.js, toast.js, loader.js + one file per page
├── images/       product/banner imagery
├── components/   reusable JS-rendered UI pieces (bottom-nav.js, etc.)
├── firebase/      firebase-config.js, firestore.rules, storage.rules
├── pages/        one .html file per screen
└── index.html     redirects to pages/splash.html
```

## Setup

1. Create a Firebase project → enable **Authentication** (Email/Password),
   **Firestore**, and **Storage**.
2. Copy your web app config into `firebase/firebase-config.js`
   (replace the `YOUR_...` placeholders).
3. Deploy the rules in `firebase/firestore.rules` and `firebase/storage.rules`
   via the Firebase console or CLI (`firebase deploy --only firestore:rules,storage`).
4. Admin access is granted via a **custom auth claim** (`admin: true`), set
   through the Firebase Admin SDK on whichever account manages the shop —
   there's no separate admin app or `admins` collection in this scope.
5. Serve the project with any static server (e.g. VS Code "Live Server",
   or `npx serve`) — ES modules require `http(s)://`, not `file://`.
6. Push to GitHub, enable GitHub Pages on the repo.

## Design system

CMYK print-press theme: Magenta drives primary actions, Cyan drives info/links,
Yellow is a rare precise highlight, Key (ink black) carries structure and text,
on an uncoated-paper background. Type: Anton (display) / Inter (body) /
JetBrains Mono (order numbers, SKUs). Signature details: a "mis-registration"
headline treatment (`.zp-misprint`) and registration-mark corner marks on
interactive cards (`.zp-reg-mark`), plus a four-dot CMYK loading animation.

Full tokens: `css/variables.css`. Component classes: `css/components.css`.

## Build plan (approve each part before the next)

- [x] **Part 1** — Project structure, Firebase setup, global CSS, shared JS (this part)
- [ ] Part 2 — Authentication (Login, Signup, Forgot Password)
- [ ] Part 3 — Home and Categories
- [ ] Part 4 — Products (Product List, Product Details)
- [ ] Part 5 — Customization and Design Upload
- [ ] Part 6 — Cart, Checkout, Orders
- [ ] Part 7 — Profile, Notifications, Support
- [ ] Part 8 — Optimization, Testing, Bug Fixes

## Firestore collections

`users`, `products`, `categories`, `orders`, `order_items`, `design_uploads`,
`addresses`, `notifications`, `reviews`, `settings`

## Storage folders

`/products`, `/designs/{userId}`, `/users/{userId}`
