<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Zesto Print</title>
  <meta name="theme-color" content="#FAF8F3" />
  <meta name="description" content="Zesto Print — upload your design, we print it, pack it, and ship it." />

  <!-- Type system: Anton (display), Inter (body), JetBrains Mono (utility) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
    rel="stylesheet"
  />

  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <!-- ==========================================================
       Toast + full-screen loader mount points (built by app.js)
  =========================================================== -->
  <div id="toastContainer" class="zp-toast-container" aria-live="polite" aria-atomic="true"></div>
  <div id="loaderOverlay" class="zp-loader-overlay">
    <div class="zp-loader" role="status" aria-label="Loading">
      <span class="zp-loader__dot zp-loader__dot--c"></span>
      <span class="zp-loader__dot zp-loader__dot--m"></span>
      <span class="zp-loader__dot zp-loader__dot--y"></span>
      <span class="zp-loader__dot zp-loader__dot--k"></span>
    </div>
  </div>

  <!-- ==========================================================
       App shell — every screen is a <section class="view"> below.
       app.js shows/hides views by id; only one is visible at a time.
  =========================================================== -->
  <div class="zp-app" id="app">

    <!-- ---------------- SPLASH ---------------- -->
    <section class="view view--active" id="view-splash" data-view="splash">
      <main class="zp-splash">
        <div class="zp-splash__mark">
          <div class="zp-splash__mark-dot zp-splash__mark-dot--c"></div>
          <div class="zp-splash__mark-dot zp-splash__mark-dot--m"></div>
          <div class="zp-splash__mark-dot zp-splash__mark-dot--y"></div>
          <div class="zp-splash__mark-dot zp-splash__mark-dot--k"></div>
        </div>

        <h1 class="zp-splash__title zp-misprint" data-text="Zesto Print">Zesto Print</h1>
        <p class="zp-splash__tagline zp-mono">YOUR DESIGN. PRINTED PERFECTLY.</p>

        <div class="zp-splash__loader" aria-hidden="true">
          <span class="zp-loader__dot zp-loader__dot--c"></span>
          <span class="zp-loader__dot zp-loader__dot--m"></span>
          <span class="zp-loader__dot zp-loader__dot--y"></span>
          <span class="zp-loader__dot zp-loader__dot--k"></span>
        </div>
      </main>
    </section>

    <!-- Further views (login, signup, home, product details, cart, etc.)
         are added here in later parts. -->

  </div>

  <!-- type="module" is required to use the Firebase Modular SDK's import syntax in app.js -->
  <script type="module" src="app.js"></script>
</body>
</html>
