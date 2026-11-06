/* Cart page: line items, coupon, summary. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var viewed = false;

  function render() {
    var t = KL.store.totals();
    var root = $('#cart-root');
    if (!t.lines.length) {
      root.innerHTML = '<div class="empty-state" id="cart-empty"><h2>Your cart is empty</h2><p>Fill it with something good.</p><a class="btn btn--primary" id="cart-empty-shop" href="shop.html" data-track="cart-empty-shop">Shop teas</a></div>';
      return;
    }
    root.innerHTML =
      '<div class="cart-layout"><div id="cart-lines">' + t.lines.map(function (l) { return KL.ui.lineHtml(l, { cartPage: true, prefix: 'cart' }); }).join('') + '</div>' +
      '<aside class="summary" id="cart-summary"><h2>Summary</h2>' +
      '<form class="coupon" id="coupon-form" novalidate><label class="visually-hidden" for="cart-coupon">Coupon code</label><input type="text" id="cart-coupon" placeholder="Coupon code" value="' + U.esc(t.coupon || '') + '" autocomplete="off">' +
      '<button type="submit" class="btn btn--ghost" id="cart-apply-coupon" data-track="cart-apply-coupon">Apply</button></form>' +
      '<div id="coupon-message" role="status"></div>' +
      '<div class="summary__row"><span>Subtotal</span><span id="cart-subtotal">' + U.money(t.subtotal) + '</span></div>' +
      '<div class="summary__row"><span>Discount' + (t.coupon && t.discount ? ' (' + t.coupon + ')' : '') + '</span><span id="cart-discount">−' + U.money(t.discount) + '</span></div>' +
      '<div class="summary__row"><span>Shipping (Standard)</span><span id="cart-shipping">' + (t.shipping ? U.money(t.shipping) : 'Free') + '</span></div>' +
      (t.couponNote ? '<p class="muted">' + U.esc(t.couponNote) + '</p>' : '') +
      '<div class="summary__row summary__row--total"><span>Total</span><span id="cart-total">' + U.money(t.total) + '</span></div>' +
      '<a class="btn btn--primary" id="cart-checkout" href="checkout.html" data-track="cart-checkout" style="width:100%;margin-top:1rem">Proceed to checkout</a>' +
      '<p class="muted" style="margin-top:.8rem;font-size:.85rem">Free standard shipping on orders of $40 or more.</p></aside></div>';
    if (!viewed) { viewed = true; KL.dl.viewCart(t); }
  }

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'coupon-form') { return; }
    e.preventDefault();
    var code = $('#cart-coupon').value;
    try {
      var res = KL.store.applyCoupon(code);
      KL.dl.coupon(res.code, true);
      render(); $('#coupon-message').innerHTML = '<div class="alert alert--success">Coupon ' + U.esc(res.code) + ' applied (' + U.esc(res.label) + ').</div>';
    } catch (err) {
      KL.dl.coupon(code.trim().toUpperCase(), false, err.message);
      $('#coupon-message').innerHTML = '<div class="form-error" role="alert">' + U.esc(err.message) + '</div>';
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-step]');
    if (b && b.closest('[data-stepper-for]')) {
      var id = b.closest('[data-stepper-for]').getAttribute('data-stepper-for');
      var line = KL.store.lines().filter(function (l) { return l.item_id === id; })[0];
      if (line) { KL.ui.setQuantity(id, line.quantity + parseInt(b.getAttribute('data-step'), 10)); }
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.hasAttribute('data-qty-input')) { KL.ui.setQuantity(e.target.getAttribute('data-qty-input'), e.target.value); }
  });
  document.addEventListener('kl:cart', render);
  render();
})();
