# components/

Reusable, JS-rendered UI pieces shared across multiple pages (as opposed to
`pages/`, which are full screens, and `css/`, which is pure styling).

Each file exports a `render*()` function that builds and injects/returns DOM,
so any page can import just what it needs.

- `bottom-nav.js` — the 5-tab bottom navigation (Home, Categories, Cart, Orders, Profile)

More will be added as each part is built — e.g. `product-card.js` (Part 4),
`design-upload.js` (Part 5), `address-form.js` (Part 6).
