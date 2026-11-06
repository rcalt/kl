/*
 * ui.js: shared UI behaviour: toasts, stars, product cards, cart drawer, add-to-cart, order view, header menu.
 */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  var U = KL.util, C = KL.catalog, $ = KL.$, $$ = KL.$$;
  var ui = KL.ui = {};

  /* ---------------------------- toasts ---------------------------- */
  ui.toast = function (message, type) {
    var stack = $('#toast-stack');
    if (!stack) {
      stack = document.createElement('div'); stack.id = 'toast-stack'; stack.className = 'toast-stack';
      stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    t.textContent = message;
    stack.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  };

  /* ---------------------------- stars ---------------------------- */
  ui.stars = function (rating) {
    var full = Math.round(rating), html = '';
    for (var i = 1; i <= 5; i++) { html += i <= full ? '★' : '<span class="stars__off">★</span>'; }
    return '<span class="stars" aria-label="' + rating + ' out of 5 stars">' + html + '</span>';
  };
  ui.badge = function (status) {
    return '<span class="badge badge--status-' + status + '" data-order-status="' + status + '">' + U.esc(U.statusLabel(status)) + '</span>';
  };

  /* ------------------------- product card ------------------------- */
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  ui.productCard = function (p, listName, position) {
    var r = KL.reviews.list(p.id), href = 'product.html?slug=' + p.slug, key = slug(listName) + '-' + p.slug;
    var dv = C.defaultVariant(p);
    return '<article class="product-card" id="card-' + key + '" data-product-id="' + p.id + '" data-product-name="' + U.esc(p.name) + '"' +
      ' data-price="' + C.fromPrice(p).toFixed(2) + '" data-list-name="' + U.esc(listName) + '" data-list-position="' + position + '" data-track="product-card">' +
      '<a class="product-card__media" href="' + href + '" data-select-item data-track="card-image-' + p.slug + '" tabindex="-1" aria-hidden="true">' +
      '<img src="' + p.images[0] + '" alt="" loading="lazy" width="400" height="400">' +
      (p.badge ? '<span class="badge badge--gold">' + U.esc(p.badge) + '</span>' : '') + '</a>' +
      '<div class="product-card__body"><p class="product-card__category">' + U.esc(p.category) + '</p>' +
      '<h3 class="product-card__title"><a href="' + href + '" data-select-item data-track="card-title-' + p.slug + '">' + U.esc(p.name) + '</a></h3>' +
      '<p class="product-card__rating">' + ui.stars(r.average) + ' <span>' + (r.count ? r.average.toFixed(1) + ' (' + r.count + ')' : 'No reviews yet') + '</span></p>' +
      '<p class="product-card__price">From ' + U.money(C.fromPrice(p)) + '</p>' +
      '<div class="product-card__actions">' +
      '<a class="btn btn--ghost" id="card-view-' + key + '" href="' + href + '" data-select-item data-track="card-view-' + p.slug + '">View</a>' +
      '<button type="button" class="btn btn--primary" id="card-quick-add-' + key + '" data-quick-add="' + dv.id + '" data-track="quick-add-' + p.slug + '">Quick add</button>' +
      '</div></div></article>';
  };

  /* --------------------------- cart drawer --------------------------- */
  function lineHtml(l, opts) {
    opts = opts || {};
    return '<div class="cart-line" data-variant-id="' + l.item_id + '" data-product-name="' + U.esc(l.product.name) + '" data-price="' + l.price.toFixed(2) + '">' +
      '<img src="' + l.product.images[0] + '" alt="' + U.esc(l.product.name) + '" width="64" height="64">' +
      '<div><p class="cart-line__name">' + U.esc(l.product.name) + '</p><p class="cart-line__variant">' + U.esc(l.variant.label) + ' · ' + U.money(l.price) + '</p>' +
      '<button type="button" class="link-button" data-remove-line="' + l.item_id + '" data-track="' + (opts.prefix || 'drawer') + '-remove-' + l.item_id + '">Remove</button></div>' +
      (opts.cartPage ? '<div class="stepper" data-stepper-for="' + l.item_id + '"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button>' +
        '<input type="text" inputmode="numeric" value="' + l.quantity + '" aria-label="Quantity" data-qty-input="' + l.item_id + '"><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>' : '') +
      '<div class="cart-line__total">' + (opts.cartPage ? '' : '<span class="muted">×' + l.quantity + '</span><br>') + U.money(l.line_total) + '</div></div>';
  }
  ui.lineHtml = lineHtml;

  function renderDrawer() {
    var box = $('#cart-drawer-items'); if (!box) { return; }
    var t = KL.store.totals();
    box.innerHTML = t.lines.length ? t.lines.map(function (l) { return lineHtml(l); }).join('') : '<p class="empty-state">Your cart is empty.</p>';
    $('#cart-drawer-subtotal').textContent = U.money(t.subtotal);
    $('#cart-drawer-checkout').setAttribute('aria-disabled', t.lines.length ? 'false' : 'true');
  }
  function updateCount() {
    var n = KL.store.count();
    $$('[data-cart-count]').forEach(function (el) { el.textContent = n; el.hidden = false; });
  }
  ui.openDrawer = function () {
    var d = $('#cart-drawer'); if (!d) { return; }
    renderDrawer();
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false');
    var o = $('#cart-drawer-overlay'); if (o) { o.classList.add('is-open'); }
    var t = KL.store.totals();
    if (t.lines.length) { KL.dl.viewCart(t); }
    var close = $('#cart-drawer-close'); if (close) { close.focus(); }
  };
  ui.closeDrawer = function () {
    var d = $('#cart-drawer'); if (!d) { return; }
    d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true');
    var o = $('#cart-drawer-overlay'); if (o) { o.classList.remove('is-open'); }
  };

  /** Add to cart: store + data layer + drawer. ctx = { listName, position, quick, noDrawer } */
  ui.addToCart = function (itemId, qty, ctx) {
    ctx = ctx || {};
    try { KL.store.add(itemId, qty); }
    catch (err) { ui.toast(err.message, 'error'); return false; }
    KL.dl.addToCart(itemId, qty, ctx);
    if (!ctx.noDrawer) { ui.openDrawer(); }
    return true;
  };
  ui.removeLine = function (itemId) {
    var line = KL.store.lines().filter(function (l) { return l.item_id === itemId; })[0];
    if (!line) { return; }
    KL.store.remove(itemId);
    KL.dl.removeFromCart(itemId, line.quantity);
  };
  /** Change a line's quantity; a decrease also counts as remove_from_cart. */
  ui.setQuantity = function (itemId, qty) {
    var line = KL.store.lines().filter(function (l) { return l.item_id === itemId; })[0];
    if (!line) { return; }
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty < 1) { return ui.removeLine(itemId); }
    qty = Math.min(qty, KL_DATA.commerce.maxQuantity);
    KL.store.update(itemId, qty);
    if (qty < line.quantity) { KL.dl.removeFromCart(itemId, line.quantity - qty); }
    else if (qty > line.quantity) { KL.dl.addToCart(itemId, qty - line.quantity, {}); }
  };

  /* --------------------------- order view --------------------------- */
  var STEPS = ['pending_payment', 'placed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  function timelineHtml(o) {
    var reached = {}, idx = 0;
    o.status_history.forEach(function (h) { reached[h.status] = h.at; var i = STEPS.indexOf(h.status); if (i > idx) { idx = i; } });
    var failed = o.status === 'payment_failed' || o.status === 'cancelled';
    return '<ol class="order-timeline" aria-label="Order progress">' + STEPS.map(function (st, i) {
      var cls = 'order-timeline__step';
      if (!failed && i < idx) { cls += ' order-timeline__step--done'; }
      if (!failed && i === idx) { cls += ' order-timeline__step--current'; }
      var at = reached[st];
      return '<li class="' + cls + '" data-order-status="' + st + '">' + U.esc(U.statusLabel(st)) +
        (at ? '<span class="order-timeline__time">' + U.fmtDateTime(at) + '</span>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function orderHtml(o, refundsList) {
    var a = o.shipping_address || {};
    var html = '<div class="card" data-order-id="' + o.id + '" data-order-status="' + o.status + '">' +
      '<p class="muted">Order <span class="order-id">' + o.id + '</span> · placed ' + U.fmtDate(o.created_at) + ' ' + ui.badge(o.status) + '</p>';
    if (o.status === 'payment_failed') { html += '<div class="alert alert--error">Payment failed for this order.</div>'; }
    html += timelineHtml(o);
    html += '<h3>Items</h3><div class="table-wrap"><table class="table"><tbody>' + o.items.map(function (i) {
      var p = C.byId(i.item_id.replace(/-[^-]+$/, ''));
      var review = KL.orders.isDelivered(o) && p ? ' <a href="product.html?slug=' + p.slug + '&review=1#reviews" data-track="order-review-' + i.item_id + '">Review this tea</a>' : '';
      return '<tr><td>' + U.esc(i.item_name) + ' (' + U.esc(i.item_variant) + ')' + review + '</td><td>×' + i.quantity + '</td><td>' + U.money(i.price * i.quantity) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    html += '<p>Subtotal ' + U.money(o.subtotal) + (o.discount ? ' · Discount −' + U.money(o.discount) + (o.coupon ? ' (' + o.coupon + ')' : '') : '') + ' · Shipping ' + U.money(o.shipping) + ' · <strong>Total ' + U.money(o.total) + '</strong></p>';
    html += '<p class="muted">Ship to: ' + U.esc([a.name, a.line1, a.city, a.region, a.postal_code, a.country].filter(Boolean).join(', ')) + '<br>Payment: ' +
      (o.payment_method === 'cod' ? 'Cash on delivery' : 'KettlePay (card)') + ' (' + U.esc(o.payment_status) + ')</p></div>';

    if (refundsList.length) {
      html += '<div class="card" style="margin-top:1rem"><h3>Refunds</h3>' + refundsList.map(function (r) {
        return '<p data-refund-id="' + r.id + '"><span class="order-id">' + r.id + '</span> · ' + U.money(r.amount) + ' · ' + U.esc(KL.refunds.REASONS[r.reason] || r.reason) + ' ' + ui.badge(r.status) + '</p>';
      }).join('') + '</div>';
    }
    if (KL.refunds.canRequest(o)) {
      html += '<form class="card" id="refund-form" style="margin-top:1rem" novalidate><h3>Request a refund</h3><div id="refund-error"></div>' +
        KL.refunds.refundable(o).filter(function (r) { return r.max > 0; }).map(function (r) {
          var opts = ''; for (var q = 1; q <= r.max; q++) { opts += '<option value="' + q + '">' + q + '</option>'; }
          return '<div class="refund-item"><label class="check"><input type="checkbox" name="refund-item" value="' + r.item.item_id + '"> ' + U.esc(r.item.item_name) + ' (' + U.esc(r.item.item_variant) + ')</label>' +
            '<select name="qty-' + r.item.item_id + '" aria-label="Quantity to refund">' + opts + '</select></div>';
        }).join('') +
        '<div class="field" style="margin-top:1rem"><label for="refund-reason">Reason</label><select id="refund-reason" name="reason"><option value="">Choose a reason</option>' +
        Object.keys(KL.refunds.REASONS).map(function (k) { return '<option value="' + k + '">' + KL.refunds.REASONS[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="refund-note">Note (optional)</label><textarea id="refund-note" name="note"></textarea></div>' +
        '<button type="submit" class="btn btn--primary" id="refund-submit" data-track="refund-submit">Request refund</button></form>';
    }
    return html;
  }

  /** Mount an order into a container. Re-renders live when the order or its refunds change (e.g. from the admin tab). */
  ui.mountOrder = function (container, orderId, email) {
    var lastSig = '';
    function sig(o) { return JSON.stringify([o.status, o.status_history.length, KL.refunds.forOrder(o.id).map(function (r) { return r.id + r.status; })]); }
    function render() {
      var o = KL.orders.get(orderId, email);
      if (!o) { container.innerHTML = '<p class="alert alert--error">We could not find that order.</p>'; return null; }
      lastSig = sig(o);
      container.innerHTML = orderHtml(o, KL.refunds.forOrder(o.id));
      var form = $('#refund-form', container);
      if (form) { form.addEventListener('submit', function (ev) { ev.preventDefault(); submitRefund(o, form); }); }
      return o;
    }
    function submitRefund(o, form) {
      var items = $$('input[name="refund-item"]:checked', form).map(function (cb) {
        return { item_id: cb.value, quantity: form.elements['qty-' + cb.value].value };
      });
      try {
        var refund = KL.refunds.request(o.id, items, form.elements.reason.value, form.elements.note.value);
        KL.dl.refundRequested(refund, o);
        ui.toast('Refund ' + refund.id + ' requested.');
        render();
      } catch (err) { $('#refund-error', form).innerHTML = '<div class="form-error" role="alert">' + U.esc(err.message) + '</div>'; }
    }
    document.addEventListener('kl:db', function () {
      var o = KL.orders.get(orderId, email);
      if (o && sig(o) !== lastSig) { render(); }
    });
    return render();
  };

  /* ---------------------- global click handling ---------------------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var sel = t.closest && t.closest('[data-select-item]');
    if (sel) {
      var card = sel.closest('.product-card'), p = card && C.byId(card.getAttribute('data-product-id'));
      if (p) { KL.dl.selectItem(p, card.getAttribute('data-list-name'), parseInt(card.getAttribute('data-list-position'), 10)); }
    }
    var quick = t.closest && t.closest('[data-quick-add]');
    if (quick) {
      var c = quick.closest('.product-card');
      ui.addToCart(quick.getAttribute('data-quick-add'), 1, { listName: c && c.getAttribute('data-list-name'), position: c && parseInt(c.getAttribute('data-list-position'), 10), quick: true });
    }
    var rm = t.closest && t.closest('[data-remove-line]');
    if (rm) { ui.removeLine(rm.getAttribute('data-remove-line')); }
    if (t.closest && (t.closest('#cart-drawer-close') || t.id === 'cart-drawer-overlay')) { ui.closeDrawer(); }
    var toggle = t.closest && t.closest('#header-menu-toggle');
    if (toggle) {
      var nav = $('#site-nav'), open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open));
    }
    var co = t.closest && t.closest('#cart-drawer-checkout');
    if (co && co.getAttribute('aria-disabled') === 'true') { e.preventDefault(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { ui.closeDrawer(); } });

  /* ---------------------- start-up behaviour ---------------------- */
  document.addEventListener('kl:cart', function () { updateCount(); renderDrawer(); });
  updateCount();

  // ?promo=CHAI10 in any URL auto-applies the coupon (URL variable demo)
  var promo = U.param('promo');
  if (promo) {
    try { KL.store.applyCoupon(promo); ui.toast('Coupon ' + promo.toUpperCase() + ' applied.'); }
    catch (err) { ui.toast(err.message, 'error'); }
  }
  // Native newsletter form lands here with ?subscribed=1
  if (U.param('subscribed') === '1') {
    KL.dl.newsletterSignup();
    ui.toast('Thanks for subscribing!');
  }
})();
