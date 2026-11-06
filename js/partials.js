/*
 * partials.js: the shared header, footer and cart drawer. Written once, injected into every page.
 *
 * Loads in <head> (no defer). Each custom tag fills itself with its markup the moment the browser
 * parses it, so the markup is in the DOM before page scripts and before GTM's DOM Ready.
 * Light DOM only (no Shadow DOM): GTM triggers, CSS and DevTools all see normal elements.
 *
 * To change the header, footer or drawer, edit the template literals below. That's it.
 */
(function () {
  'use strict';
  var page = document.documentElement.getAttribute('data-page') || '';
  var KL = window.KL || {};

  /* ======================= GOOGLE TAG MANAGER (edit here, applies to every page) =======================
   * This file loads in <head> on every page, so the GTM head snippet below runs there.
   * The container ID is window.KL_GTM_ID (set by boot.js from ?gtm=, then localStorage, then config.js).
   * No ID set = nothing is loaded. To add another tag to the <head> of every page (a pixel, for example),
   * put it right below the snippet.
   */
  if (window.KL_GTM_ID) {
    // ---- GTM head snippet (standard Google code, ID swapped for window.KL_GTM_ID) ----
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl + (window.KL_GTM_ENV || '');
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', window.KL_GTM_ID);
  }
  // ---- GTM body snippet (the <noscript> iframe). Inserted as the first thing inside <body>, by the header below. ----
  function gtmNoscript() {
    return window.KL_GTM_ID
      ? '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' + window.KL_GTM_ID +
        '" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>'
      : '';
  }
  /* ============================================================================================ */

  // Which nav link is "current" for each page
  var NAV_FOR = { shop: 'shop', product: 'shop', guide: 'guide', tasting: 'tasting', gifting: 'gifting', 'track-order': 'track-order' };
  var activeNav = NAV_FOR[page] || '';

  function cartCount() {
    try {
      var c = JSON.parse(localStorage.getItem('kl_cart') || '{}'), n = 0;
      (c.lines || []).forEach(function (l) { n += l.quantity || 0; });
      return n;
    } catch (e) { return 0; }
  }
  function navLink(key, href, label) {
    var cur = activeNav === key ? ' aria-current="page"' : '';
    return '<a id="nav-' + key + '" href="' + href + '" data-track="nav-' + key + '"' + cur + '>' + label + '</a>';
  }

  /* ============================== HEADER ============================== */
  class KLHeader extends HTMLElement {
    connectedCallback() {
      var user = KL.user || {};
      var first = user.loggedIn && user.name ? user.name.split(' ')[0] : '';
      var accountLabel = user.loggedIn ? first : 'Log in';
      var accountHref = user.loggedIn ? 'account.html' : 'login.html';
      var count = cartCount();
      // GTM <noscript> goes at the very top of <body> (see the GTM block at the top of this file)
      if (!document.getElementById('gtm-noscript-holder')) {
        document.body.insertAdjacentHTML('afterbegin', '<div id="gtm-noscript-holder" hidden>' + gtmNoscript() + '</div>');
      }
      this.innerHTML = `
<header class="site-header" id="site-header">
  <div class="container site-header__inner">
    <a class="site-header__logo" id="header-logo" href="index.html" data-track="header-logo">
      <img src="img/logo.svg" alt="" width="34" height="34"><span>Kettle &amp; Leaf</span>
    </a>
    <button type="button" class="site-header__toggle" id="header-menu-toggle" data-track="header-menu-toggle"
            aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      ${navLink('shop', 'shop.html', 'Shop')}
      ${navLink('guide', 'brewing-guide.html', 'Brewing Guide')}
      ${navLink('tasting', 'tea-tasting.html', 'Tea Tasting')}
      ${navLink('gifting', 'gifting.html', 'Gifting')}
      ${navLink('track-order', 'track-order.html', 'Track Order')}
    </nav>
    <div class="site-header__actions">
      <a id="header-account" href="${accountHref}" data-track="header-account">${accountLabel}</a>
      <!-- Teaching case (B4.x): clicks on the cart icon land on the <svg>/<path> inside the <a>, not on the link. -->
      <a class="site-header__cart" id="header-cart" href="cart.html" data-track="header-cart" aria-label="Cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 4h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.76L20 8H6.2"></path>
          <circle cx="9.5" cy="19.5" r="1.3"></circle><circle cx="17" cy="19.5" r="1.3"></circle>
        </svg>
        <span class="cart-count" id="header-cart-count" data-cart-count>${count}</span>
      </a>
    </div>
  </div>
</header>`;
    }
  }

  /* ============================== FOOTER ============================== */
  class KLFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
<footer class="site-footer" id="site-footer">
  <div class="container">
    <div class="site-footer__grid">
      <div>
        <h3>Kettle &amp; Leaf</h3>
        <p>Single-estate teas from India, packed fresh and shipped to your kettle. (A fictional store for the Funnelysis GTM course.)</p>
        <p><a id="footer-email" href="mailto:hello@kettleandleaf.example" data-track="footer-email">hello@kettleandleaf.example</a><br>
           <a id="footer-phone" href="tel:+15555550123" data-track="footer-phone">+1 (555) 555-0123</a></p>
      </div>
      <div>
        <h3>Shop</h3>
        <ul>
          <li><a href="shop.html" data-track="footer-shop">All teas</a></li>
          <li><a href="brewing-guide.html" data-track="footer-guide">Brewing guide</a></li>
          <li><a href="gifting.html" data-track="footer-gifting">Corporate gifting</a></li>
          <li><a href="track-order.html" data-track="footer-track">Track an order</a></li>
        </ul>
      </div>
      <div>
        <h3>Follow &amp; legal</h3>
        <ul>
          <li><a id="footer-instagram" href="https://www.instagram.com/" target="_blank" rel="noopener" data-track="footer-instagram">Instagram</a></li>
          <li><a id="footer-youtube" href="https://www.youtube.com/" target="_blank" rel="noopener" data-track="footer-youtube">YouTube</a></li>
          <li><a href="privacy.html" data-track="footer-privacy">Privacy policy</a></li>
          <li><a href="cookie-policy.html" data-track="footer-cookies">Cookie policy</a></li>
        </ul>
      </div>
      <div>
        <h3>Newsletter</h3>
        <p>Brewing tips and first-flush news. No spam.</p>
        <!-- Native form submit on purpose: this is the form GTM's Form Submission trigger CAN catch. -->
        <form class="newsletter" id="newsletter-form" method="get" action="index.html" data-track="newsletter-form">
          <input type="hidden" name="subscribed" value="1">
          <label class="visually-hidden" for="newsletter-email">Email address</label>
          <input type="email" id="newsletter-email" name="email" placeholder="you@example.com" required>
          <button type="submit" class="btn btn--gold" id="newsletter-submit" data-track="newsletter-submit">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="site-footer__legal">
      <span>&copy; 2026 Kettle &amp; Leaf (demo store). No real payments or orders.</span>
      <span class="mono">v${(window.KL && KL.siteVersion) || '1.0.0'}</span>
    </div>
  </div>
</footer>`;
    }
  }

  /* ============================ CART DRAWER ============================ */
  class KLCartDrawer extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
<aside class="cart-drawer" id="cart-drawer" aria-hidden="true" aria-label="Shopping cart" role="dialog">
  <div class="cart-drawer__head">
    <h2>Your cart</h2>
    <button type="button" class="btn btn--ghost btn--small" id="cart-drawer-close" data-track="cart-drawer-close" aria-label="Close cart">Close</button>
  </div>
  <div class="cart-drawer__items" id="cart-drawer-items"></div>
  <div class="cart-drawer__foot">
    <div class="cart-drawer__subtotal"><span>Subtotal</span><span id="cart-drawer-subtotal">$0.00</span></div>
    <a class="btn btn--ghost" id="cart-drawer-view" href="cart.html" data-track="cart-drawer-view">View cart</a>
    <a class="btn btn--primary" id="cart-drawer-checkout" href="checkout.html" data-track="cart-drawer-checkout">Checkout</a>
  </div>
</aside>
<div class="cart-drawer__overlay" id="cart-drawer-overlay"></div>`;
    }
  }

  customElements.define('kl-header', KLHeader);
  customElements.define('kl-footer', KLFooter);
  customElements.define('kl-cart-drawer', KLCartDrawer);
})();
