/*
 * datalayer.js: EVERY dataLayer push on the site lives here. Page scripts call KL.dl.* and never dataLayer.push.
 * Rules: GA4 ecommerce schema; { ecommerce: null } before every ecommerce event; value/price are numbers;
 * currency is always USD; every ecommerce-style event carries an event_id (purchase reuses the order's event_id).
 * Everything is gated by the "Data layer" toggle in the demo panel (Off = Basics course mode).
 * "Bug mode" (demo panel) deliberately plants the 7 errors marked BUG below.
 */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  var U = KL.util, C = KL.catalog;
  var dl = KL.dl = {};
  var LOG_KEY = 'kl_dl_log';

  function s() { return KL.settings.get(); }
  function bug() { return s().bug; }
  function clone(x) { try { return JSON.parse(JSON.stringify(x)); } catch (e) { return x; } }

  /* ---- log (shown in the demo panel; survives page loads within the tab) ---- */
  function loadLog() { try { return JSON.parse(sessionStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; } }
  function saveLog() { try { sessionStorage.setItem(LOG_KEY, JSON.stringify(dl.log.slice(0, 100))); } catch (e) { /* ignore */ } }
  dl.log = loadLog();

  /** The one place that calls dataLayer.push. */
  dl.push = function (obj) {
    if (!s().dataLayer) { return false; }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
    var entry = { at: new Date().toISOString(), page: KL.page, data: clone(obj) };
    dl.log.unshift(entry); saveLog();
    document.dispatchEvent(new CustomEvent('kl:dlpush', { detail: entry }));
    return true;
  };

  function ecom(event, ecommerce, extra, opts) {
    opts = opts || {};
    if (!opts.noClear) { dl.push({ ecommerce: null }); }
    var o = { event: event, event_id: (extra && extra.event_id) || U.uuid() };
    for (var k in (extra || {})) { o[k] = extra[k]; }
    o.ecommerce = ecommerce;
    return dl.push(o);
  }
  function plain(event, data) {
    var o = { event: event, event_id: U.uuid() };
    for (var k in (data || {})) { o[k] = data[k]; }
    return dl.push(o);
  }
  function sum(items) { return U.round2(items.reduce(function (t, i) { return t + i.price * i.quantity; }, 0)); }
  /** BUG 4: items in the "Related Products" list lose their item_id. */
  function bugItems(items, listName) {
    if (bug() && listName === 'Related Products') { items.forEach(function (i) { delete i.item_id; }); }
    return items;
  }
  function productItem(p, listName, position) {
    var v = C.defaultVariant(p);
    return C.item(v.id, { listName: listName, index: position - 1 });
  }
  function orderItems(order) {
    return order.items.map(function (i, idx) {
      var it = C.item(i.item_id, { quantity: i.quantity, index: idx }) || { item_id: i.item_id, item_name: i.item_name, item_brand: 'Kettle & Leaf', item_variant: i.item_variant, price: i.price, quantity: i.quantity, index: idx };
      it.price = i.price;
      return it;
    });
  }
  function cartItems(t) {
    return t.lines.map(function (l, idx) { return C.item(l.item_id, { quantity: l.quantity, index: idx }); });
  }

  /* ---- product browsing ---- */
  dl.viewItemList = function (products, listName) {
    var items = bugItems(products.map(function (p, i) { return productItem(p, listName, i + 1); }), listName);
    return ecom('view_item_list', { item_list_name: listName, items: items });
  };
  dl.selectItem = function (product, listName, position) {
    var items = bugItems([productItem(product, listName, position)], listName);
    return ecom('select_item', { item_list_name: listName, items: items });
  };
  dl.viewItem = function (itemId) {
    var it = C.item(itemId, { quantity: 1 });
    // BUG 5: ecommerce is not cleared before view_item, so stale items from the previous push can leak.
    return ecom('view_item', { currency: 'USD', value: it.price, items: [it] }, null, { noClear: bug() });
  };

  /* ---- cart ---- */
  dl.addToCart = function (itemId, qty, ctx) {
    ctx = ctx || {};
    var it = C.item(itemId, { quantity: qty, listName: ctx.listName, index: (ctx.position || 1) - 1 });
    var items = bugItems([it], ctx.listName);
    // BUG 3: Quick add pushes a misspelled event name.
    var name = bug() && ctx.quick ? 'add_to_card' : 'add_to_cart';
    var ok = ecom(name, { currency: 'USD', value: sum([it]), items: items });
    // BUG 2: every add_to_cart is pushed twice.
    if (bug()) { ecom(name, { currency: 'USD', value: sum([it]), items: items }); }
    return ok;
  };
  dl.removeFromCart = function (itemId, qty) {
    var it = C.item(itemId, { quantity: qty });
    return ecom('remove_from_cart', { currency: 'USD', value: sum([it]), items: [it] });
  };
  dl.viewCart = function (totals) {
    return ecom('view_cart', { currency: 'USD', value: totals.subtotal, items: cartItems(totals) });
  };
  dl.coupon = function (code, ok, reason) {
    return plain(ok ? 'coupon_applied' : 'coupon_failed', ok ? { coupon: code } : { coupon: code, error: reason });
  };

  /* ---- checkout ---- */
  dl.beginCheckout = function (t) {
    var e = { currency: 'USD', value: U.round2(t.subtotal - t.discount), coupon: t.discount ? t.coupon : undefined, items: cartItems(t) };
    if (bug()) { delete e.currency; }   // BUG 6: currency missing on begin_checkout
    return ecom('begin_checkout', e);
  };
  dl.addShippingInfo = function (t, tier) {
    return ecom('add_shipping_info', { currency: 'USD', value: U.round2(t.subtotal - t.discount), coupon: t.discount ? t.coupon : undefined, shipping_tier: tier, items: cartItems(t) });
  };
  dl.addPaymentInfo = function (t, paymentType) {
    return ecom('add_payment_info', { currency: 'USD', value: t.total, coupon: t.discount ? t.coupon : undefined, payment_type: paymentType, items: cartItems(t) });
  };
  dl.checkoutError = function (info) { return plain('checkout_error', info); };

  /** purchase: uses the order's event_id so browser event and webhook share it (Meta CAPI dedupe).
   *  Dedupe guard (demo panel): when On, reloading the confirmation page does not push purchase again. */
  dl.purchase = function (order) {
    var fired = []; try { fired = JSON.parse(localStorage.getItem('kl_purchased') || '[]'); } catch (e) { /* ignore */ }
    if (s().dedupe && fired.indexOf(order.id) > -1) { return false; }
    var a = order.shipping_address || {}, parts = (a.name || '').split(' ');
    var ok = ecom('purchase', {
      transaction_id: order.id,
      value: bug() ? String(order.total.toFixed(2)) : order.total,   // BUG 1: value sent as a string
      tax: 0, shipping: order.shipping, currency: 'USD', coupon: order.coupon || undefined,
      items: orderItems(order)
    }, {
      event_id: order.event_id,
      user_data: {
        email: order.email, phone_number: order.phone,
        address: { first_name: parts[0] || '', last_name: parts.slice(1).join(' '), city: a.city, region: a.region, postal_code: a.postal_code, country: a.country }
      }
    });
    if (ok) { fired.push(order.id); localStorage.setItem('kl_purchased', JSON.stringify(fired)); }
    return ok;
  };

  /* ---- accounts ---- */
  dl.signUp = function (user) { return plain('sign_up', { method: 'email', user_id: user.id, customer_tier: user.tier }); };
  dl.login = function (user) { return plain('login', { method: 'email', user_id: user.id, customer_tier: user.tier }); };
  dl.logout = function () { return plain('logout', { method: 'email' }); };

  /* ---- orders and refunds ---- */
  dl.orderTracked = function (order) { return plain('order_tracked', { order_id: order.id, order_status: order.status }); };
  dl.refundRequested = function (refund, order) {
    return ecom('refund_requested', { currency: 'USD', value: refund.amount, items: refund.items.map(function (i, idx) { return C.item(i.item_id, { quantity: i.quantity, index: idx }) || i; }) },
      { event_id: refund.event_id, order_id: order.id });
  };
  dl.refund = function (refund, order) {
    var e = {
      transaction_id: order.id, currency: 'USD', value: refund.amount,
      items: refund.items.map(function (i, idx) { return C.item(i.item_id, { quantity: i.quantity, index: idx }) || i; })
    };
    if (bug()) { delete e.transaction_id; }   // BUG 7: refund pushed without transaction_id
    return ecom('refund', e, { event_id: refund.event_id });
  };

  /* ---- reviews, leads, content ---- */
  dl.reviewStarted = function (productId) { return plain('review_started', { item_id: productId }); };
  dl.reviewSubmitted = function (review) {
    return plain('review_submitted', { item_id: review.product_id, rating: review.rating, verified_buyer: review.verified_buyer });
  };
  dl.newsletterSignup = function () { return plain('newsletter_signup', {}); };
  dl.generateLead = function (data) { return plain('generate_lead', data); };
  dl.tastingBooked = function (data) { return plain('tasting_booked', data); };
  dl.guideFeedback = function (helpful) { return plain('guide_feedback', { helpful: helpful }); };
})();
