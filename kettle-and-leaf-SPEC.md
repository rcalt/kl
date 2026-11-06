# Kettle & Leaf: Demo Ecommerce Site Spec

Build spec for the demo store used across the Funnelysis GTM course (Basics, Web Basics helper, Intermediate, Advanced). Hand this file to Claude Code as the source of truth.

## 1. Purpose

Kettle & Leaf is a fictional D2C tea brand. The site looks and behaves like a small real store, but every part of it exists to be tracked, inspected and broken on camera. It is a teaching prop: no real payments, no real personal data, no real security.

Four rules shape every decision:

1. **Zero install, zero build.** The whole project is plain static files. Students and the author both just copy the folder to any static host or open it with a local static server. No Node, no PHP, no database, no build step.
2. **Readable markup.** A student opening DevTools should understand the page instantly. Clear IDs, classes and `data-*` attributes everywhere. The shared header, footer and cart drawer are injected by JavaScript (section 4), but synchronously and into the normal DOM, so DevTools shows them as ordinary HTML.
3. **Switchable behaviour.** The same site serves a Basics student (no data layer, UI-only tracking) and an Advanced student (full ecommerce data layer, event IDs, user data, simulated webhooks). Behaviour is controlled by toggles in a demo panel, not by separate copies.
4. **Edit once, ship everywhere.** The shared header, footer and cart drawer live in one JS file, and all four products are rendered by one product page from one data file.

## 2. Architecture

- **Front end:** plain HTML, CSS and vanilla JavaScript. No frameworks, no bundler, no TypeScript.
- **JavaScript style:** classic scripts (no ES modules), everything hangs off one global namespace `window.KL`. This keeps the code easy to read in DevTools and in the helper course.
- **No server code.** There is no API and no `fetch` to local files. All "database" behaviour runs in the browser:
  - **Seed data** lives in plain, human-readable JS files in `/data` (users with plain-text passwords, products, orders, refunds, reviews).
  - **Live data** is copied into `localStorage` on first visit and all changes (signups, orders, refunds, reviews, admin status changes) are saved there.
  - "Reset demo data" in the demo panel wipes `localStorage` and re-seeds.
- **Cross-tab sync:** pages listen for the `storage` event, so an admin tab advancing an order updates an open order-tracking tab live.
- **Separate files:** HTML, CSS and JS are separate. No inline `<style>`, no inline event handlers. No inline scripts at all: the GTM snippet also lives in `js/partials.js` (section 14).
- Responsive down to 360px. Semantic HTML, visible focus states, alt text on all images.
- `<meta name="robots" content="noindex, nofollow">` on every page.

### Security note (put this in the README too)

Passwords are stored in plain text in `data/seed-users.js` and the session is just a user ID in `localStorage`. This is deliberate so students can read everything. **No real authentication exists. Never use a real password.** The login form shows a "Demo accounts only" note.

### Known limits of the static approach

- Data is per browser and per origin. `127.0.0.1:5500` and `localhost:5500` are separate stores. Clearing site data wipes it.
- Admin and customer share one browser (two tabs). That is fine on camera.
- Webhooks are sent from the browser, not a backend (see section 9). Say so on camera in chapter A10.2.
- The HttpOnly cookie lesson is not demonstrable here (cover it with a slide).
- Pages opened as `file://` will not work properly with GTM, cookies or Tag Assistant. A local static server or hosting is required.
- View Page Source shows the `<kl-header>`, `<kl-footer>` and `<kl-cart-drawer>` tags and an empty product container, not their contents. DevTools Elements shows the full markup. This is intentional and used as a teaching moment (page source vs the live DOM).

## 3. How students run it

The project folder itself (zipped) is what students receive. Three ways to use it:

| Way | Steps |
| --- | --- |
| **A. Funnelysis-hosted copy** | Open the hosted URL with `?gtm=GTM-XXXXXXX` appended once. Zero setup. Their data stays in their own browser. |
| **B. Local** | Open the project folder in VS Code, start the Live Server extension, open the site. (Any static server works, e.g. `python3 -m http.server`.) |
| **C. Own hosting** | Drag the folder into Netlify Drop, GitHub Pages, or upload through cPanel. |

**Their own GTM container.** Students never edit HTML to use their container. They add `?gtm=GTM-XXXXXXX` once, or type the ID in the demo panel; it is saved in `localStorage` (`kl_gtm_id`) and the GTM snippet on every page uses it.

**Gateway and booking widget (separate origins).** `js/config.js` has `gatewayUrl` and `bookingUrl`, defaulting to Funnelysis-hosted copies of `/gateway` and `/booking-widget` (placeholder URLs, replace on deployment). Students who want to run everything locally open `gateway/` and `booking-widget/` as their own Live Server windows (different ports = different origins) and set the URLs in the demo panel. Both folders are included in the zip.

## 4. Shared layout without a build step

The header, footer and cart drawer are written once and injected by JavaScript into every page. There is no build, no Node and no copy-pasting across pages.

**How it works (`js/partials.js`)**

- A classic script in `<head>` (no `defer`, no `async`) defines three custom tags: `<kl-header>`, `<kl-footer>` and `<kl-cart-drawer>`. Each tag fills itself with its markup the moment the browser parses it.
- Because this happens during parsing, the header, footer and drawer are already in the DOM before the page's own scripts run and before GTM's DOM Ready. No flash, and no race with tracking.
- **Light DOM only, no Shadow DOM.** GTM click triggers, CSS selectors and DevTools all see ordinary elements.
- No `fetch` and no extra network request. It behaves the same on every host and in Live Server.
- The markup lives as indented template literals in `partials.js`, one commented block per partial, so editing it feels like editing HTML.
- CSS reserves space (`kl-header { display: block; min-height: 72px; }`) so nothing jumps while loading.
- The header sets the active nav link itself from `<html data-page="...">`.
- Every page carries a one-line HTML comment beside each tag, e.g. `<!-- Header: injected by js/partials.js -->`, so students reading the source know where it comes from.

**Page skeleton.** Every page follows this; only the title, description, `data-page`, page CSS and page script change.

```html
<!doctype html>
<html lang="en" data-page="shop">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shop all teas | Kettle & Leaf</title>
  <meta name="description" content="Four teas, loose and bagged.">
  <meta name="robots" content="noindex, nofollow">
  <!-- Google Fonts links -->
  <link rel="stylesheet" href="css/site.css">
  <link rel="stylesheet" href="css/pages/shop.css">
  <script src="js/config.js"></script>
  <script src="js/boot.js"></script>
  <script src="js/partials.js"></script>
</head>
<body>
  <!-- GTM body snippet (noscript iframe): inserted here by js/partials.js -->
  <!-- Header: injected by js/partials.js -->
  <kl-header></kl-header>
  <main id="main"> ... page content ... </main>
  <!-- Footer: injected by js/partials.js -->
  <kl-footer></kl-footer>
  <kl-cart-drawer></kl-cart-drawer>

  <!-- Common scripts: identical block on every page -->
  <script src="data/products.js" defer></script>
  <script src="data/seed-users.js" defer></script>
  <script src="data/seed-orders.js" defer></script>
  <script src="data/seed-refunds.js" defer></script>
  <script src="data/seed-reviews.js" defer></script>
  <script src="js/util.js" defer></script>
  <script src="js/db.js" defer></script>
  <script src="js/services.js" defer></script>
  <script src="js/datalayer.js" defer></script>
  <script src="js/ui.js" defer></script>
  <script src="js/consent-mock.js" defer></script>
  <script src="js/demo-panel.js" defer></script>
  <!-- Page script -->
  <script src="js/pages/shop.js" defer></script>
</body>
</html>
```

**Shared CSS and scripts**

- `css/site.css` uses `@import` for `tokens.css`, `base.css`, `layout.css`, `components.css` and `demo-panel.css`, so each page links just `site.css` plus its own page CSS.
- The common script block is the same on every page and its order matters. Keep it stable: adding a new shared script means editing every page.

**Teaching note.** Page source shows the `<kl-header>` tags, not what is inside them; DevTools Elements shows the full markup. Use this in chapters W1.1 and I6.1 as a live example of page source vs the DOM.

## 5. File structure

The project root is the deliverable. There is no `src` or `dist`.

```
index.html  shop.html  product.html  cart.html  checkout.html
order-confirmation.html  login.html  account.html  order.html
track-order.html  brewing-guide.html  tea-tasting.html
gifting.html  admin.html  privacy.html  cookie-policy.html
/css
  site.css               # @imports the five shared files below
  tokens.css  base.css  layout.css  components.css  demo-panel.css
  /pages
    home.css  shop.css  product.css  cart.css  checkout.css
    account.css          # login, account, order, track-order
    admin.css
    content.css          # guide, tasting, gifting, legal
/js
  config.js              # origins, defaults, GTM placeholder, YouTube ID (loads in <head>)
  boot.js                # runs in <head> before GTM (section 14)
  partials.js            # <kl-header>, <kl-footer>, <kl-cart-drawer> (loads in <head>)
  util.js                # uuid, money formatting, dates
  db.js                  # localStorage "database", seeding, reset
  services.js            # KL.auth, KL.store, KL.orders, KL.refunds,
                         # KL.reviews, KL.webhooks (one commented section each)
  datalayer.js           # ALL dataLayer pushes live here
  ui.js                  # cart count, drawer behaviour, toasts
  consent-mock.js        # banner UI and consent updates
  demo-panel.js
  /pages
    home.js  shop.js  product.js  cart.js  checkout.js
    confirmation.js  login.js  account.js  order.js
    track-order.js  guide.js  tasting.js  gifting.js  admin.js
/data
  products.js
  seed-users.js
  seed-orders.js
  seed-refunds.js
  seed-reviews.js
/img
/downloads
  brewing-chart.pdf
/gateway
  index.html  gateway.css  gateway.js
/booking-widget
  index.html  widget.css  widget.js
README.md                # student instructions first, author notes below
```

## 6. Brand and design

**Tone.** Warm, a little premium, tea heritage without clichés. Short copy.

**Colours** (CSS variables in `tokens.css`):

| Token | Hex | Use |
| --- | --- | --- |
| `--green-900` | `#163323` | Header, footer, headings |
| `--green-700` | `#24503A` | Primary buttons, links |
| `--green-100` | `#E4EDE6` | Section backgrounds |
| `--gold-500` | `#C49A2C` | Accents, badges, prices, focus rings, star ratings |
| `--gold-200` | `#EFDDA8` | Highlights, offer banner |
| `--cream` | `#F8F4EA` | Page background |
| `--ink` | `#1C1C1A` | Body text |
| `--danger` | `#A23B2A` | Errors, out of stock, declined |

**Fonts** (Google Fonts): headings **Young Serif**; body and UI **Instrument Sans**; order IDs, SKUs and code **JetBrains Mono**.

**Feel.** Generous whitespace, thin gold rules between sections, 6px button radius, product images on cream with soft shadow. No hero carousels.

## 7. Product catalogue

`data/products.js` is the single source of truth, used by the product page, the front end (cart, orders) and the order pricing code (prices are always recomputed from this file, never from values stored in the cart).

Currency: **USD**. Prices exclude tax; no tax is charged.

| Product | Category | SKU base | Variants (price) |
| --- | --- | --- | --- |
| Darjeeling First Flush | Black Tea | `KL-DJ` | 50g $9.00 · 100g $16.00 · 250g $36.00 |
| Assam Breakfast | Black Tea | `KL-AS` | Loose 100g $7.00 · Loose 250g $15.00 · 25 tea bags $6.00 · 50 tea bags $10.00 |
| Nilgiri Green | Green Tea | `KL-NG` | 50g $8.00 · 100g $14.00 |
| Masala Chai Blend | Chai | `KL-MC` | 100g $6.50 · 250g $13.00 · 500g $24.00 (**out of stock**) |

Variant SKU format: `KL-DJ-050`, `KL-AS-B25`, etc.

Each product needs: name, slug, short and long description, tasting notes, brewing (temperature, time), origin, 2 to 3 images, optional badge ("Bestseller", "New").

**Commerce rules:**

- Quantity 1 to 10 per line.
- Shipping: Standard free at $40 and above, otherwise $5.99. Express $12.00.
- Coupon `CHAI10` = 10% off subtotal. Coupon `FIRSTCUP` = $5 off orders over $30. Invalid codes show an error.
- `?promo=CHAI10` in any URL auto-applies the coupon (URL variable demo).
- Out-of-stock variant: selectable, shows "Out of stock", Add to cart disabled.
- Money is stored as numbers with 2 decimals and displayed as `$16.00`.
- Stock is static (no decrementing on purchase).

## 8. Data and storage

### Seed files

Each seed file is plain, commented JS that assigns to a shared object, for example:

```js
window.KL_DATA = window.KL_DATA || {};
KL_DATA.users = [
  { id: 'u_1001', name: 'Priya Sharma', email: 'priya@example.com',
    password: 'tea123', tier: 'subscriber', created_at: '2026-01-14T10:20:00Z' }
];
```

(JS rather than JSON so it loads without `fetch`.) Header comment in each file explains the shape. A `KL_DATA.seedVersion` number lives in `products.js`; bumping it makes returning visitors re-seed on next load.

### localStorage keys

| Key | Holds |
| --- | --- |
| `kl_db_users`, `kl_db_orders`, `kl_db_refunds`, `kl_db_reviews`, `kl_db_webhooks` | The live "tables" (arrays of objects, same shape as seeds) |
| `kl_db_seed_version` | Seed version last applied |
| `kl_session` | Logged-in user ID |
| `kl_cart` | Cart lines (item ID, quantity) and applied coupon |
| `kl_gtm_id` | Student's GTM container ID |
| `kl_demo_settings` | Demo panel toggles and URLs |
| `kl_checkout` (sessionStorage) | Checkout progress |

`db.js` exposes `KL.db.all(table)`, `get`, `insert`, `update`, `remove`, `reset()`. Every write dispatches a custom event and updates `localStorage`, which triggers `storage` events in other tabs.

### Record shapes

**User:** `id, name, email, password, tier, created_at`. Seed three: Priya (subscriber, one delivered order and one in transit), Arjun (first-time buyer, one delivered order), Meera (wholesale, one order with a completed refund). New signups get tier `new`.

**Order:**

```json
{
  "id": "KL-20261103-4821",
  "user_id": "u_1001",
  "email": "priya@example.com",
  "items": [
    { "item_id": "KL-DJ-100", "item_name": "Darjeeling First Flush", "item_variant": "100g", "price": 16.00, "quantity": 2 }
  ],
  "subtotal": 32.00, "discount": 0, "coupon": null,
  "shipping": 5.99, "total": 37.99, "currency": "USD",
  "shipping_address": { "name": "", "line1": "", "city": "", "region": "", "postal_code": "", "country": "" },
  "phone": "",
  "payment_method": "kettlepay",
  "payment_status": "paid",
  "status": "shipped",
  "status_history": [
    { "status": "placed", "at": "2026-11-03T09:00:00Z" },
    { "status": "packed", "at": "2026-11-03T15:00:00Z" },
    { "status": "shipped", "at": "2026-11-04T08:00:00Z" }
  ],
  "event_id": "uuid",
  "created_at": "2026-11-03T09:00:00Z"
}
```

Statuses in order: `pending_payment` → `placed` → `packed` → `shipped` → `out_for_delivery` → `delivered`. Side states: `payment_failed`, `cancelled`, `refunded`, `partially_refunded`. Guest orders have `user_id: null` and are tracked by order ID plus email.

**Refund:** `id` (`RF-1001`), `order_id`, `user_id`, `items[{item_id, quantity, price}]`, `amount`, `reason`, `status`, `requested_at`, `decided_at`. Statuses: `requested` → `approved` or `rejected`. Reasons: `damaged`, `wrong_item`, `not_as_described`, `changed_mind`, `other`.

**Review:** `id` (`RV-1001`), `product_id`, `user_id`, `user_name`, `rating` (1 to 5), `title`, `body`, `verified_buyer`, `created_at`. Seed 2 to 4 per product.

**Webhook log entry:** `id`, `event` (e.g. `refund.approved`), `payload`, `target_url`, `result` (`logged only`, `sent (opaque response)`, or `error: …`), `at`.

## 9. Services (replacing the old HTTP API)

All logic lives in `KL.*` modules operating on `KL.db`. Functions return plain objects or throw `Error` with a readable message that the UI shows.

| Module | Functions and rules |
| --- | --- |
| `KL.auth` | `signup(name, email, password)` rejects duplicate emails; `login(email, password)` checks seed and live users; `logout()`; `current()`. Session is the user ID in `kl_session`. |
| `KL.store` | Cart add/update/remove/clear, coupon apply, `totals()`. Prices always recomputed from `products.js`. |
| `KL.orders` | `create(cart, contact, shipping, method)` builds the order, generates the order ID and an `event_id`; KettlePay orders start `pending_payment`, COD orders start `placed`. `setPayment(id, 'paid' or 'declined')` moves to `placed` or `payment_failed`. `listForUser()`, `get(id, email?)` (owner, or matching email for guests). `advance(id)` moves to the next status and appends to `status_history`. |
| `KL.refunds` | `request(orderId, items, reason, note)`: only on `delivered` or `partially_refunded` orders, only for quantities not already refunded. `decide(id, 'approved' or 'rejected')`: approval sets the order to `refunded` or `partially_refunded`. |
| `KL.reviews` | `list(productId)` with average, count and rating breakdown; `add(productId, rating, title, body)`: one review per user per product; `verified_buyer` is true if the user has a `delivered` order containing that product. Non-buyers may review without the badge. |
| `KL.webhooks` | `emit(event, order/refund)` builds the payload and logs it; sends it if a webhook URL is set. `resend(id)`. |

**Webhooks (for Advanced chapter A10).** Events: `order.created`, `order.paid`, `order.status_changed`, `refund.approved`. Payload: event name, order ID, `user_id`, email, items, value, currency, `event_id`, timestamp (and refund details for refunds). The webhook URL (for example a server-side GTM endpoint) is set in the demo panel. The browser sends it with:

```js
fetch(url, { method: 'POST', mode: 'no-cors',
             headers: { 'Content-Type': 'text/plain' },
             body: JSON.stringify(payload) });
```

`text/plain` plus `no-cors` avoids a CORS preflight, so any endpoint that reads the body works; the response is opaque and logged as such. Every log row on the admin page has **Copy payload**, **Copy as cURL** and **Resend**, so the presenter can fire the same payload from a terminal or Postman to show a true server-to-server call.

## 10. Pages

### Header (all pages, `<kl-header>` from `partials.js`)

Logo, nav (Shop, Brewing Guide, Tea Tasting, Gifting, Track Order), account link ("Log in" or the user's first name), cart icon with count.

### Home

- Hero: headline, subline, two CTAs ("Shop teas", "Find your tea").
- Featured products: 4 cards (image, name, from-price, average rating, "View" and "Quick add").
- Story strip: "From estate to cup" three-step block.
- Offer banner partway down (`#offer-banner`): "10% off with CHAI10", only visible after scrolling (element visibility demo).
- Latest reviews: 3 entries from the reviews table.
- Newsletter form in the footer: **native form submit** (`<form method="get">` to `?subscribed=1`). This is the form GTM's form trigger CAN catch.
- Footer: links, Instagram and YouTube outbound links, `mailto:` and `tel:` links, privacy and cookie policy.

### Shop

Product grid (list name "Shop All"), category filter chips (client-side, URL does not change), sort dropdown.

### Product page (`product.html?slug=…`)

One page serves all four products. `product.js` reads `slug` from the URL, finds the product in `products.js` and renders everything into containers on the page. Slugs: `darjeeling-first-flush`, `assam-breakfast`, `nilgiri-green`, `masala-chai-blend`. Product cards link to `product.html?slug=…`. An unknown slug shows "Product not found" with a link to the shop.

Rendering runs before DOM Ready, so the product exists in the DOM before GTM's DOM Ready, and `view_item` is pushed after rendering. `product.js` also sets `document.title`. Page source shows empty containers, DevTools shows the full product (see the teaching note in section 4). The URL query string (`?slug=`) also gives a natural example for URL variables in chapter I4.3.

- Image gallery, name, price (updates with variant), average rating and review count (links to `#reviews`), badge.
- Variant selector as radio pills, quantity stepper, Add to cart, cart drawer.
- Tabs: Description, Tasting notes, Brewing, Shipping.
- **Reviews section** (`#reviews`): average and rating breakdown bars, review list with a "Verified buyer" badge, sort (newest, highest, lowest). "Write a review" opens a form (star picker, title, body) if logged in; otherwise "Log in to review" returning to this page after login.
- "You may also like": the other 3 products (list name "Related Products").

### Cart

Line items with variant, quantity stepper, remove, line total; coupon field; summary (subtotal, discount, shipping, total); "Proceed to checkout"; empty state.

### Checkout (single-page app)

One page, three steps, `history.pushState` with `?step=contact|shipping|payment`. The page **never reloads** between steps (History Change trigger demo). Logged-in users get email, name and saved address prefilled.

1. **Contact:** email, phone, "Create an account" checkbox (adds a password field). Continue is `type="button"` with a JS handler and `preventDefault`. This is the "form that won't fire" from chapter B8.1.
2. **Shipping:** name, address line, city, state/region, postal code, country (dropdown), method (Standard or Express).
3. **Payment method:** "Pay with KettlePay (card)" redirects to the gateway; "Cash on delivery" creates the order as `placed` and goes straight to confirmation.

Order summary sidebar on all steps; browser Back works between steps.

### Mock payment gateway (`/gateway`, separate origin)

- Branded **KettlePay** (fictional), visually a different site (neutral grey and blue, own logo).
- Receives `order`, `amount`, `currency`, `return` (the store's confirmation URL) and `gtm` (the student's container ID) in the query string, and **preserves any `_gl` linker parameter** on return (cross-domain demo). It loads the same GTM container ID so the container can run on both domains. It only redirects to `return` values that begin with `http://` or `https://`.
- Large notice: **"DEMO ONLY: do not enter real card details."** Card number pre-filled `4242 4242 4242 4242` and read-only.
- "Simulate success" → `<return>?order=…&status=paid`. "Simulate decline" → `<return>?order=…&status=declined`, which sends the shopper back to the checkout payment step with an error.

### Order confirmation

- Reads the `status` parameter and calls `KL.orders.setPayment` for KettlePay orders, then shows order ID (mono), items, totals, address and payment method.
- Fires `purchase` (section 12) and `order.created` / `order.paid` webhooks.
- "Track this order" → `order.html?id=…`.
- Guests see "Create an account to track all your orders" with a prefilled sign-up link.
- Reloading this page is the duplicate-purchase demo.

### Login

Two panels: Log in (email, password) and Sign up (name, email, password). "Demo accounts only" note and a collapsible list of the three seed logins for quick demos. Supports `?next=` to return to the previous page.

### Account

Requires login (redirects to login otherwise). Profile summary (name, email, tier) and **My orders** table: order ID, date, item count, total, status badge, "View" link. Log out button.

### Order detail (`order.html?id=`)

- **Tracking timeline:** the six statuses as a horizontal stepper on desktop, vertical on mobile, with timestamps from `status_history`, current step in gold. Updates live when the admin tab changes the status.
- Items, totals, address, payment method.
- **Refund section** (only when eligible): checkbox per item with a quantity selector, reason dropdown, optional note, "Request refund". Existing refunds listed with status badges.
- "Review this tea" link per item when delivered, jumping to that product's review form.

### Track order

Order ID plus email form for guests. Shows the same timeline and refund option.

### Admin (demo only)

Prominent banner: "Demo admin. No login. Not part of the store." Three tabs:

1. **Orders:** all orders with status; "Advance status" button per order.
2. **Refunds:** pending requests with Approve / Reject.
3. **Webhooks:** the log, newest first, expandable payloads, with Copy payload, Copy as cURL and Resend.

This is how the presenter moves an order along on camera and how refunds reach GA4 and ad platforms in the Advanced course.

### Brewing guide

Long article (2,000+ words, clear H2s) for scroll depth; YouTube embed with `enablejsapi=1` (video ID in `config.js`, placeholder); PDF download link; "Was this helpful? Yes / No"; dismissible popup after 30 seconds (timer demo).

### Tea tasting

Intro plus an `<iframe>` of the booking widget (third origin, from `bookingUrl`, with the store's origin passed as `?parent=`). The widget form (date, slot, name, email, "Book") sends `window.parent.postMessage({ type: 'tasting_booked', slot, date }, parentOrigin)`; the parent listens, checks `event.origin` equals the widget origin, and pushes `tasting_booked` when the data layer is on.

### Gifting

Corporate gifting page with lead form (company, name, work email, team size, message), JS submit with `preventDefault`, inline success, pushes `generate_lead`.

### Privacy and cookie policy

Short placeholder text, needed for CMP chapters.

## 11. Markup conventions for tracking

**IDs:** every interactive element and major section has a unique kebab-case ID: `#hero-cta-shop`, `#pdp-add-to-cart`, `#cart-apply-coupon`, `#checkout-continue-contact`, `#login-submit`, `#refund-submit`, `#review-submit`.

**Classes:** BEM style. `.product-card`, `.product-card__title`, `.btn--primary`, `.variant-picker__option--selected`, `.order-timeline__step--current`, `.review-card__badge`.

**Data attributes:**

| Attribute | Example | Purpose |
| --- | --- | --- |
| `data-track` | `hero-cta-shop` | Stable tracking name for any clickable element |
| `data-track-section` | `hero` | Page section |
| `data-product-id` | `KL-DJ` | Product |
| `data-variant-id` | `KL-DJ-100` | Variant |
| `data-product-name` | `Darjeeling First Flush` | Readable name |
| `data-price` | `16.00` | Numeric price, no symbol |
| `data-list-name` | `Featured Products` | Item list on cards |
| `data-list-position` | `2` | Position in list (1-based) |
| `data-step` | `shipping` | Checkout step containers |
| `data-order-id` | `KL-20261103-4821` | Order rows, order page |
| `data-order-status` | `shipped` | Order rows, timeline |
| `data-rating` | `5` | Review cards, star picker |

**Deliberate teaching cases** (keep them, and comment them in the HTML):

- A gift-wrap button on product pages with **no ID, no data attribute** and only a generated-looking class (`class="css-7f3k2q"`). Used in W2.3 for fragile selectors.
- One link whose visible text changes with state, showing why Click Text is a weak condition.
- Cart icon where the click lands on an `<svg>` inside the `<a>` (Click Element vs closest link).

**Page globals** (JS Variable demo, set by `boot.js`):

```js
window.KL = {
  siteVersion: '1.0.0',
  pageType: 'product',   // home | shop | product | cart | checkout | confirmation | account | order | content | admin
  user: { loggedIn: false, id: null, tier: null }
};
```

**Cookies** (1st-party cookie demo, written by `boot.js`): `kl_visitor_type` (`new` / `returning`) and `kl_ab_variant` (`A` / `B`, B changes the hero headline). Both are normal JS cookies (path `/`, 30 days).

## 12. Data layer

All pushes go through `js/datalayer.js`; page scripts never call `dataLayer.push` directly.

**Initialisation** (done by `boot.js`, synchronously in `<head>` before the GTM snippet; user fields come straight from `localStorage`, so there is no waiting):

```js
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  page_type: 'product',
  site_version: '1.0.0',
  user_logged_in: false,
  user_id: undefined,
  customer_tier: undefined
});
```

**Rules:**

- GA4 ecommerce schema. Push `{ ecommerce: null }` before every ecommerce event.
- `value` and `price` are numbers. `currency: 'USD'` always present.
- Every ecommerce event, `generate_lead`, `refund_requested` and `refund` carries an `event_id`. For `purchase`, use the order's `event_id` so the browser event and the webhook share it (Meta CAPI deduplication).
- `purchase` carries `user_data` (email, phone, name, city, postal code, country) for enhanced conversions. All data is fake.
- `crypto.randomUUID()` needs a secure context (localhost or https); `util.js` falls back to a simple UUID generator otherwise.

**Item object:**

```js
{
  item_id: 'KL-DJ-100',
  item_name: 'Darjeeling First Flush',
  item_brand: 'Kettle & Leaf',
  item_category: 'Black Tea',
  item_variant: '100g',
  price: 16.00,
  quantity: 1,
  index: 0,
  item_list_name: 'Featured Products'
}
```

**Events:**

| Event | Fired when | Page |
| --- | --- | --- |
| `view_item_list` | Product grid renders | Home, Shop, Product |
| `select_item` | Product card clicked | Home, Shop, Product |
| `view_item` | Product load and variant change | Product |
| `add_to_cart` | Add to cart / Quick add | Home, Shop, Product |
| `remove_from_cart` | Remove or quantity decrease | Cart, drawer |
| `view_cart` | Cart load, drawer open | Cart |
| `coupon_applied` / `coupon_failed` | Coupon Apply | Cart |
| `begin_checkout` | Checkout step 1 | Checkout |
| `add_shipping_info` | Shipping step continue | Checkout |
| `add_payment_info` | Payment method chosen | Checkout |
| `checkout_error` | Payment declined | Checkout |
| `purchase` | Confirmation load | Confirmation |
| `sign_up` / `login` / `logout` | Auth actions (`method: 'email'`) | Login, Account |
| `order_tracked` | Order page or track form shows an order (`order_id`, `order_status`) | Order, Track |
| `refund_requested` | Refund request saved (`order_id`, `value`, items) | Order, Track |
| `refund` | Admin approves a refund (GA4 refund schema: `transaction_id`, `value`, items). Pushed on the admin page, and the same payload goes out as a webhook | Admin |
| `review_started` | Write a review opened | Product |
| `review_submitted` | Review saved (`item_id`, `rating`, `verified_buyer`) | Product |
| `newsletter_signup` | Page loads with `?subscribed=1` | Any |
| `generate_lead` | Gifting form success | Gifting |
| `tasting_booked` | postMessage from widget | Tea tasting |
| `guide_feedback` | Helpful yes/no | Brewing guide |

## 13. Demo panel and toggles

Floating panel, hidden by default, opened with `?demo=1` (persisted) or **Ctrl+Shift+D**. Own CSS file so it never looks like the store. Settings in `localStorage` under `kl_demo_settings`.

1. **GTM container ID** field with "Apply and reload", plus a note that `?gtm=GTM-XXXXXXX` does the same.
2. **Live data layer log:** every push, newest first, expandable JSON, copy button.
3. **Toggles:**
   - Data layer: On / Off (Off = only GTM's own events; Basics course mode).
   - Purchase dedupe guard: On / Off (Off = reloading confirmation fires `purchase` again).
   - Mock consent banner: On / Off.
   - Bug mode: On / Off.
   - A/B variant: Force A / Force B / Random.
4. **URLs:** gateway URL, booking widget URL, webhook URL (each editable, defaults from `config.js`).
5. **Quick actions:** log in as Priya / Arjun / Meera, log out, clear cart, fill checkout with test data, open admin, **Reset all demo data** (wipes `kl_db_*`, cart and session, then re-seeds; keeps GTM ID and demo settings).
6. **Info:** current GTM container ID, page type, current user, whether the data layer is on.

**Mock consent banner** (`consent-mock.js`). Off by default (the course installs a real CMP through GTM). When on, `boot.js` sets the Consent Mode defaults (all denied except `security_storage`) before the GTM snippet runs, and `consent-mock.js` renders the banner whose Accept / Reject / Customise buttons send consent updates.

**Bug mode** (chapter I10.2). Plants these errors in the data layer:

1. `purchase.value` sent as the string `"37.99"`.
2. `add_to_cart` pushed twice per click.
3. Event name typo `add_to_card` on Quick add only.
4. `item_id` missing on related-product items.
5. `ecommerce` not cleared before `view_item`, so stale items leak.
6. `currency` missing on `begin_checkout`.
7. `refund` pushed without `transaction_id`.

## 14. GTM installation

- Every page's `<head>` loads `js/config.js`, `js/boot.js`, then `js/partials.js`. **Both GTM pieces live in one place, a clearly marked block at the top of `js/partials.js`**, so editing them (or adding another pixel below them) applies to every page. The head snippet is Google's standard code run from that block, wrapped in `if (window.KL_GTM_ID)` so nothing loads when no container is set; the only differences are the container ID argument and an optional `window.KL_GTM_ENV` suffix on the URL. Because it is written by JavaScript, View Page Source does not show it (DevTools Elements does); teach chapters B2.4 to B2.6 from DevTools or from `partials.js`.

```html
(function(w,d,s,l,i){/* standard GTM snippet body */})
(window,document,'script','dataLayer',window.KL_GTM_ID);
```

- `boot.js` sets `window.KL_GTM_ID` in this order: `?gtm=` URL parameter (also saved to `kl_gtm_id`), then `kl_gtm_id`, then the `gtmId` default in `config.js` (`GTM-XXXXXXX`). If the ID is still the placeholder, the snippet and the `noscript` iframe are skipped and the demo panel shows "No GTM container set".
- The GTM `noscript` iframe is inserted by `<kl-header>` as the first thing in `<body>`, using the same runtime ID. Being JS-written, it only appears when JavaScript is on (a known limit: it cannot serve its real no-JS purpose).
- Optional environment parameters (`gtm_auth`, `gtm_preview`) for chapter I6.3 live in `config.js` and are appended to the snippet URL when set.
- **No gtag.js, Meta Pixel or other vendor tags** are hard-coded. Everything goes in through GTM during the course.
- `/gateway` and `/booking-widget`: the gateway loads GTM from the `gtm` query parameter (section 10); the booking widget loads none by default (a comment shows where).

## 15. How the site maps to the course

| Feature | Chapters |
| --- | --- |
| GTM snippet (in `partials.js` and DevTools, not view-source), runtime container ID | B2.4, B2.5, B2.6 |
| Injected header and footer (page source vs the live DOM) | W1.1, I6.1 |
| Hero CTAs, nav, Quick add, fragile gift-wrap button | B4.2, B4.3, W2.3 |
| Native newsletter form | B4.4 |
| Checkout contact step (`preventDefault`) | B8.1, W4.1 |
| Brewing guide scroll, video, PDF, timer popup | B4.5, B4.7, B5.2 |
| Offer banner on scroll | B4.6 |
| Data layer toggle and log | B8.1, W6.1, I1.x |
| Full ecommerce pushes | I3.x |
| `?promo=`, cookies, `window.KL` | I4.2, I4.3, W4.3 |
| Single-page checkout | I5.3 |
| Gateway on second origin | I9.1 |
| Booking widget iframe | I9.2 |
| Login, sign up, `user_id`, `customer_tier` | I9.3 |
| Reviews, order tracking events | I2.1, I5.2 |
| Mock consent banner | B6.2, I8.x |
| Bug mode | I10.2 |
| Dedupe toggle | I3.4 |
| `event_id`, `user_data` | A6.3, A6.4, A7.1 |
| Gifting lead form | B5.6, A7.3 |
| Simulated webhooks, copy as cURL | A10.2 |
| Refund requests and approvals | A10.3 |

## 16. Build order for Claude Code

1. Scaffold folders, `site.css`, `tokens.css`, `base.css`, `config.js`, `boot.js` (GTM ID resolution, cookies, `window.KL`, consent defaults, data layer init), `partials.js` (header, footer, cart drawer) and one page skeleton. Confirm a blank page loads with the header, footer and GTM snippet (the snippet comes from `partials.js`).
2. `util.js`, `db.js`, seed files, reset.
3. `products.js`, `product.html` with `product.js`, Home and Shop.
4. Cart (`KL.store`), cart page and drawer.
5. `KL.auth`, login and account pages.
6. `KL.orders`, checkout SPA, gateway, confirmation.
7. Order detail, track order, `KL.refunds` and refund UI.
8. `KL.reviews` and the product reviews section.
9. Admin page and `KL.webhooks`.
10. `datalayer.js` with every event, gated by the Data layer toggle.
11. Demo panel, bug mode, consent mock.
12. Content pages: brewing guide, tea tasting and booking widget, gifting, legal.
13. `README.md`: student instructions (section 3) first, author notes below.
14. QA pass: every page uses the identical skeleton and common script block; header, footer and drawer appear on every page with no visible flash; in GTM Preview the header exists at DOM Ready (test with a DOM Element variable on the header); every interactive element has an ID and `data-track`; every event in section 12 fires with the right payload; the site works with the data layer off; Reset restores a clean demo; the folder works from a subfolder on a static host.

## 17. Out of scope

- Real payments, emails, real authentication, password hashing.
- A real backend (webhooks are simulated from the browser; use Copy as cURL for a true server call).
- Search, wishlist, multi-language, multiple currencies.
- Inventory decrementing on purchase.