// customer-app/js/splash.js
// Entry point of the app. Waits for Firebase to resolve the current auth
// session, holds for a minimum splash duration so the brand animation
// isn't cut short, then routes the customer.

import { auth } from "../firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ROUTES } from "./constants.js";
import { sleep, goTo } from "./utils.js";

const MIN_SPLASH_DURATION_MS = 1200;

async function boot() {
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

  if (user) {
    goTo(ROUTES.HOME);
  } else {
    goTo(ROUTES.LOGIN);
  }
}

boot();
