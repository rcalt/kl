/*
 * Checkout: a single-page app with three steps (contact, shipping, payment).
 * The page NEVER reloads between steps; it uses history.pushState with ?step=contact|shipping|payment
 * (History Change trigger demo). Progress is kept in sessionStorage under kl_checkout.
 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$, $$ = KL.$$;
  var STEPS = ['contact', 'shipping', 'payment'];
  var beganCheckout = false;

  /* ---------- state ---------- */
  function load() { try { return JSON.parse(sessionStorage.getItem('kl_checkout') || '{}'); } catch (e) { return {}; } }
  function save(s) { try { sessionStorage.setItem('kl_checkout', JSON.stringify(s)); } catch (e) { /* ignore */ } }
  var state = load();
  state.contact = state.contact || {}; state.shipping = state.shipping || { method: 'standard' };

  if (!KL.store.count()) { location.replace('cart.html'); return; }

  /* ---------- prefill for logged-in users ---------- */
  var me = KL.auth.current();
  if (me) {
    state.contact.email = state.contact.email || me.email;
    var last = KL.orders.listForUser()[0];
    var a = last ? last.shipping_address : null;
    state.shipping.name = state.shipping.name || (a ? a.name : me.name);
    if (a) { ['line1', 'city', 'region', 'postal_code', 'country'].forEach(function (k) { state.shipping[k] = state.shipping[k] || a[k]; }); }
    if (last && !state.contact.phone) { state.contact.phone = last.phone; }
    $('#checkout-account-row').hidden = true;
  }
  function fill() {
    $('#checkout-email').value = state.contact.email || '';
    $('#checkout-phone').value = state.contact.phone || '';
    $('#checkout-create-account').checked = !!state.contact.create_account;
    $('#checkout-password-field').hidden = !state.contact.create_account;
    $('#ship-name').value = state.shipping.name || '';
    $('#ship-line1').value = state.shipping.line1 || '';
    $('#ship-city').value = state.shipping.city || '';
    $('#ship-region').value = state.shipping.region || '';
    $('#ship-postal').value = state.shipping.postal_code || '';
    $('#ship-country').value = state.shipping.country || 'US';
    var m = state.shipping.method || 'standard';
    $$('input[name="ship-method"]').forEach(function (r) { r.checked = r.value === m; });
    $$('input[name="pay-method"]').forEach(function (r) { r.checked = r.value === (state.method || 'kettlepay'); });
  }

  /* ---------- order summary sidebar ---------- */
  function renderSummary() {
    var t = KL.store.totals({ shipping_method: state.shipping.method });
    $('#checkout-summary').innerHTML = '<h2>Order summary</h2>' + t.lines.map(function (l) {
      return '<div class="summary__row"><span>' + U.esc(l.product.name) + ' <span class="muted">(' + U.esc(l.variant.label) + ') ×' + l.quantity + '</span></span><span>' + U.money(l.line_total) + '</span></div>';
    }).join('') +
      '<div class="summary__row"><span>Subtotal</span><span>' + U.money(t.subtotal) + '</span></div>' +
      (t.discount ? '<div class="summary__row"><span>Discount (' + U.esc(t.coupon) + ')</span><span>−' + U.money(t.discount) + '</span></div>' : '') +
      '<div class="summary__row"><span>Shipping (' + (t.shipping_method === 'express' ? 'Express' : 'Standard') + ')</span><span>' + (t.shipping ? U.money(t.shipping) : 'Free') + '</span></div>' +
      '<div class="summary__row summary__row--total"><span>Total</span><span id="checkout-total">' + U.money(t.total) + '</span></div>';
  }

  /* ---------- step navigation (history.pushState) ---------- */
  function show(step, push) {
    if (STEPS.indexOf(step) < 0) { step = 'contact'; }
    if (step !== 'contact' && !state.contact.email) { step = 'contact'; }
    if (step === 'payment' && !state.shipping.line1) { step = 'shipping'; }
    $$('[data-step]', $('#checkout-root')).forEach(function (el) { el.hidden = el.getAttribute('data-step') !== step; });
    $$('#checkout-steps li').forEach(function (li) {
      var i = STEPS.indexOf(li.getAttribute('data-for'));
      li.classList.toggle('is-current', li.getAttribute('data-for') === step);
      li.classList.toggle('is-done', i < STEPS.indexOf(step));
    });
    var url = '?step=' + step;
    if (push) { history.pushState({ step: step }, '', url); } else { history.replaceState({ step: step }, '', url); }
    document.title = 'Checkout (' + step + ') | Kettle & Leaf';
    if (step === 'contact' && !beganCheckout) { beganCheckout = true; KL.dl.beginCheckout(KL.store.totals()); }
    renderSummary();
    var heading = $('[data-step="' + step + '"] h2'); if (heading) { heading.setAttribute('tabindex', '-1'); }
  }
  window.addEventListener('popstate', function (e) { show((e.state && e.state.step) || U.param('step') || 'contact', false); });

  function err(id, msg) { $('#' + id).innerHTML = msg ? '<div class="form-error" role="alert">' + U.esc(msg) + '</div>' : ''; }

  /* ---------- step 1: contact. Continue is type="button" with a JS handler (the "form that won't fire") ---------- */
  $('#checkout-create-account').addEventListener('change', function (e) { $('#checkout-password-field').hidden = !e.target.checked; });
  $('#checkout-continue-contact').addEventListener('click', function (e) {
    e.preventDefault();
    var email = $('#checkout-email').value.trim(), phone = $('#checkout-phone').value.trim(), create = $('#checkout-create-account').checked;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { return err('contact-error', 'Please enter a valid email address.'); }
    if (!phone) { return err('contact-error', 'Please enter a phone number.'); }
    if (create && !KL.auth.current()) {
      try {
        var u = KL.auth.signup(email.split('@')[0], email, $('#checkout-password').value);
        KL.dl.signUp(u);
        KL.user = { loggedIn: true, id: u.id, tier: u.tier, name: u.name };
        $('#checkout-account-row').hidden = true;
        KL.ui.toast('Account created (demo).');
      } catch (ex) { return err('contact-error', ex.message); }
    }
    err('contact-error', '');
    state.contact = { email: email, phone: phone, create_account: false };
    save(state); show('shipping', true);
  });

  /* ---------- step 2: shipping ---------- */
  $$('input[name="ship-method"]').forEach(function (r) {
    r.addEventListener('change', function () { state.shipping.method = r.value; save(state); renderSummary(); });
  });
  $('#checkout-continue-shipping').addEventListener('click', function (e) {
    e.preventDefault();
    var s = {
      name: $('#ship-name').value.trim(), line1: $('#ship-line1').value.trim(), city: $('#ship-city').value.trim(),
      region: $('#ship-region').value.trim(), postal_code: $('#ship-postal').value.trim(), country: $('#ship-country').value,
      method: ($('input[name="ship-method"]:checked') || {}).value || 'standard'
    };
    if (!s.name || !s.line1 || !s.city || !s.region || !s.postal_code) { return err('shipping-error', 'Please fill in every address field.'); }
    err('shipping-error', '');
    state.shipping = s; save(state);
    KL.dl.addShippingInfo(KL.store.totals({ shipping_method: s.method }), s.method === 'express' ? 'Express' : 'Standard');
    show('payment', true);
  });
  $('#checkout-back-contact').addEventListener('click', function () { history.back(); });
  $('#checkout-back-shipping').addEventListener('click', function () { history.back(); });

  /* ---------- step 3: payment ---------- */
  function goToGateway(order, t) {
    var form = document.createElement('form');
    form.method = 'get'; form.action = KL.urls.gateway(); form.id = 'gateway-redirect-form';
    var back = new URL('order-confirmation.html', location.href).href;
    var fields = { order: order.id, amount: order.total.toFixed(2), currency: order.currency, 'return': back };
    if (KL.gtm.configured) { fields.gtm = KL.gtm.id; }
    Object.keys(fields).forEach(function (k) {
      var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = fields[k]; form.appendChild(i);
    });
    document.body.appendChild(form);
    // requestSubmit fires a real "submit" event, so GTM's cross-domain linker can add _gl.
    if (form.requestSubmit) { form.requestSubmit(); } else { form.submit(); }
  }
  $('#checkout-place-order').addEventListener('click', function (e) {
    e.preventDefault();
    var method = ($('input[name="pay-method"]:checked') || {}).value;
    if (!method) { return err('payment-error', 'Choose a payment method.'); }
    err('payment-error', '');
    state.method = method; save(state);
    var t = KL.store.totals({ shipping_method: state.shipping.method });
    KL.dl.addPaymentInfo(t, method === 'cod' ? 'Cash on delivery' : 'KettlePay');
    try {
      var existing = state.orderId ? KL.db.get('orders', state.orderId) : null, order;
      if (existing && existing.status === 'payment_failed' && method === 'kettlepay') { order = KL.orders.retryPayment(existing.id); }
      else { order = KL.orders.create(KL.store.raw(), state.contact, state.shipping, method); }
      state.orderId = order.id; save(state);
      if (method === 'cod') {
        KL.store.clear();
        location.href = 'order-confirmation.html?order=' + encodeURIComponent(order.id) + '&status=cod';
      } else { goToGateway(order, t); }
    } catch (ex) { err('payment-error', ex.message); }
  });

  /* ---------- start ---------- */
  fill();
  var first = U.param('step') || 'contact';
  if (U.param('error') === 'declined') {
    first = 'payment';
    $('#payment-banner').innerHTML = '<div class="form-error" role="alert" id="payment-declined">Your KettlePay payment was declined. Please try again or choose cash on delivery.</div>';
    KL.dl.checkoutError({ error_type: 'payment_declined', order_id: state.orderId, payment_type: 'KettlePay' });
  }
  show(first, false);
})();
