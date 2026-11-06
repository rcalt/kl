# Kettle & Leaf: demo store for the Funnelysis GTM course

Kettle & Leaf is a **fictional tea store** built to be tracked, inspected and broken on camera. It is plain HTML, CSS and JavaScript. There is **nothing to install and nothing to build**.

> **Security note.** Passwords are stored in plain text in `data/seed-users.js` and the "session" is just a user ID in `localStorage`. This is deliberate so you can read everything. **No real authentication exists. Never use a real password, real email or real card on this site.**

---

## For students

### 1. Get the site running

Pick **one** of these.

| Way | Steps |
| --- | --- |
| **A. Hosted copy** | Open the hosted URL your course gives you and add `?gtm=GTM-XXXXXXX` (your own container ID) once. Your data stays in your own browser. |
| **B. Local** | Download the repo (green **Code** button, then **Download ZIP**) and unzip it. Open the folder in VS Code, install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**. |
| **C. Your own hosting** | Drag the whole folder into [Netlify Drop](https://app.netlify.com/drop), push it to GitHub Pages, or upload it through cPanel. |

No VS Code? Any static server works. From inside the folder:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

> Do **not** double-click `index.html` (a `file://` address). GTM, cookies and Tag Assistant need a real `http://` address.

### 2. Connect your GTM container

You never edit HTML for this. Either:

- add `?gtm=GTM-XXXXXXX` to any page URL once (it is remembered), **or**
- open the **demo panel**, type the ID, and click **Apply and reload**.

Until a container is set, the GTM snippet is skipped and the demo panel says "No GTM container set".

### 3. The demo panel

Press **Ctrl+Shift+D** (or add `?demo=1` to any URL, which is remembered) to open it. It contains:

- your GTM container ID
- a **live data layer log** (every push, expandable, with a copy button)
- toggles: **Data layer** On/Off, **Purchase dedupe guard**, **Mock consent banner**, **Bug mode**, **A/B variant**
- editable gateway, booking widget and webhook URLs
- quick actions: log in as Priya / Arjun / Meera, clear cart, fill checkout, open admin, **Reset all demo data**

### 4. Demo accounts

All three use the password `tea123`.

| Name | Email | Tier |
| --- | --- | --- |
| Priya Sharma | priya@example.com | subscriber |
| Arjun Mehta | arjun@example.com | new |
| Meera Iyer | meera@example.com | wholesale |

### 5. Handy things to know

- **Coupons:** `CHAI10` (10% off) and `FIRSTCUP` ($5 off orders over $30). Add `?promo=CHAI10` to any URL to apply one automatically.
- **Test card:** the KettlePay gateway card is pre-filled and read-only. It is not a real card.
- **Admin:** open `admin.html` to move orders along (Advance status), approve refunds and see webhook logs. Open it in a second tab and watch an order-tracking tab update live.
- **Reset:** the demo panel's **Reset all demo data** wipes orders, accounts, cart and session, then re-seeds. Your GTM ID and settings are kept.
- **Data is per browser and per origin.** `localhost:5500` and `127.0.0.1:5500` are separate stores. Clearing site data wipes it.
- **View Page Source vs DevTools:** page source shows `<kl-header>`, `<kl-footer>` and an empty product container. DevTools Elements shows the full markup. That difference is on purpose.

### 6. Running the payment gateway and booking widget on their own origins (optional)

By default `gateway/` and `booking-widget/` are loaded from the same site so everything works out of the box. For the real cross-domain lessons, run each as its own server on another port (for example in VS Code open `gateway/` in a second Live Server window), then paste the URLs into the demo panel (**URLs** section).

---

## Author notes

### Where things live

```
*.html                 16 pages, all with the identical skeleton (see below)
/css                   site.css @imports tokens/base/layout/components/demo-panel; /css/pages = one file per page group
/js
  config.js            origins, GTM placeholder, YouTube ID (loads in <head>)
  boot.js              runs in <head> BEFORE GTM: settings, GTM ID, cookies, consent defaults, dataLayer init
  partials.js          <kl-header>, <kl-footer>, <kl-cart-drawer> (edit the template literals to change them)
  util.js db.js        helpers and the localStorage "database"
  services.js          KL.catalog, auth, store, orders, refunds, reviews, webhooks
  datalayer.js         EVERY dataLayer push (page scripts never call dataLayer.push)
  ui.js                toasts, product cards, cart drawer, order view
  consent-mock.js      mock banner
  demo-panel.js        floating panel
  /pages               one script per page
/data                  products.js (single source of truth) and the seed-*.js files
/gateway               KettlePay mock gateway (separate origin)
/booking-widget        tasting booking widget (third origin, talks to the parent via postMessage)
```

### Page skeleton

Every page has the same `<head>` order (`config.js`, `boot.js`, `partials.js`) and the same deferred "common scripts" block in the same order. If you add a shared script, add it to **every** page. Only the title, description, `data-page`, page CSS and page script change.

The GTM head snippet and the body `<noscript>` iframe both live in **`js/partials.js`** (see the GTM block at the top of that file), so you edit them once and every page follows. The container ID is `window.KL_GTM_ID`, set by `boot.js`; with no ID set, nothing loads. `gtm_auth` / `gtm_preview` from `config.js` are appended when set. Because the snippet is written by JavaScript, View Page Source does not show it; DevTools Elements does. (The `<noscript>` iframe is also JS-written, so it only appears when JavaScript is on.)

### Data model

Seed data lives in `data/seed-*.js` and is copied to `localStorage` (`kl_db_*`) on first visit. **Bump `KL_DATA.seedVersion` in `data/products.js`** to make returning visitors re-seed. Order statuses run `pending_payment > placed > packed > shipped > out_for_delivery > delivered`, with side states `payment_failed`, `cancelled`, `refunded`, `partially_refunded`.

Pricing rules (all in `data/products.js` and `KL.store`): quantity 1 to 10 per line; Standard shipping $5.99, free when the cart subtotal is $40 or more (before discount); Express $12.00; no tax; stock never decrements.

### Data layer and bug mode

All events are listed in `js/datalayer.js`. Bug mode (demo panel) plants seven deliberate errors, each marked `BUG n` in that file: purchase value as a string, `add_to_cart` twice, `add_to_card` typo on Quick add, missing `item_id` in the Related Products list, `ecommerce` not cleared before `view_item`, missing `currency` on `begin_checkout`, and `refund` without `transaction_id`.

### Webhooks (say this on camera in chapter A10.2)

Webhooks are **simulated from the browser**, not a backend. When a webhook URL is set, the browser sends it with `fetch(..., { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } })`, so the response is opaque. On the admin page, **Copy as cURL** gives a command that fires the same payload from a terminal for a true server-to-server call.

### Known limits of the static approach

- Data is per browser and per origin; admin and customer share one browser (two tabs).
- `file://` does not work properly with GTM, cookies or Tag Assistant.
- The HttpOnly cookie lesson cannot be shown here (cover it with a slide).
- GA4 cross-domain linking: the checkout hands off to the gateway with a real form `submit` event so GTM's linker can add `_gl`; the gateway keeps `_gl` on the return URL.

### QA checklist

Every page uses the identical skeleton; header, footer and drawer appear with no flash; every event in the spec fires with the right payload; the site works with the data layer off; **Reset** restores a clean demo; the folder works from a subfolder on a static host (all paths are relative).

### Placeholders to replace before publishing

- `js/config.js`: `gatewayUrl` and `bookingUrl` (hosted copies), `youtubeId` (a real video), `gtmId` if you want a default container.
- Footer social links point to `instagram.com` and `youtube.com` generally; set real profile URLs in `js/partials.js`.
