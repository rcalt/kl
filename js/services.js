/*
 * services.js: all the "back end" logic, running in the browser on top of KL.db.
 * One commented section per module: KL.catalog, KL.auth, KL.store, KL.orders, KL.refunds, KL.reviews, KL.webhooks.
 * Functions return plain objects, or throw Error with a readable message that the UI shows.
 */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  var U = KL.util, db = KL.db;
  var COMMERCE = (window.KL_DATA && KL_DATA.commerce) || {};
  var FLOW = ['pending_payment', 'placed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  var DELIVERED_LIKE = ['delivered', 'partially_refunded', 'refunded'];

  function nowIso() { return new Date().toISOString(); }
  function readStore(k, fallback) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }

  /* =========================================================================
   * KL.catalog: read-only helpers over data/products.js
   * ========================================================================= */
  var catalog = KL.catalog = {
    products: function () { return KL_DATA.products; },
    bySlug: function (slug) { return KL_DATA.products.filter(function (p) { return p.slug === slug; })[0] || null; },
    byId: function (id) { return KL_DATA.products.filter(function (p) { return p.id === id; })[0] || null; },
    /** Find a variant by SKU (e.g. KL-DJ-100). Returns { product, variant } or null. */
    find: function (itemId) {
      for (var i = 0; i < KL_DATA.products.length; i++) {
        var p = KL_DATA.products[i];
        for (var j = 0; j < p.variants.length; j++) {
          if (p.variants[j].id === itemId) { return { product: p, variant: p.variants[j] }; }
        }
      }
      return null;
    },
    defaultVariant: function (p) {
      return p.variants.filter(function (v) { return v.inStock; })[0] || p.variants[0];
    },
    fromPrice: function (p) {
      return Math.min.apply(null, p.variants.map(function (v) { return v.price; }));
    },
    /** GA4 item object for a variant. */
    item: function (itemId, opts) {
      opts = opts || {};
      var hit = catalog.find(itemId);
      if (!hit) { return null; }
      var it = {
        item_id: hit.variant.id,
        item_name: hit.product.name,
        item_brand: 'Kettle & Leaf',
        item_category: hit.product.category,
        item_variant: hit.variant.label,
        price: hit.variant.price,
        quantity: opts.quantity || 1,
        index: opts.index || 0
      };
      if (opts.listName) { it.item_list_name = opts.listName; }
      return it;
    }
  };

  /* =========================================================================
   * KL.auth: demo accounts. Session = the user ID in localStorage (kl_session). NOT real security.
   * ========================================================================= */
  var auth = KL.auth = {
    current: function () {
      var id = localStorage.getItem('kl_session');
      return id ? db.get('users', id) : null;
    },
    signup: function (name, email, password) {
      name = (name || '').trim(); email = (email || '').trim().toLowerCase();
      if (!name) { throw new Error('Please enter your name.'); }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { throw new Error('Please enter a valid email address.'); }
      if (!password || password.length < 6) { throw new Error('Password must be at least 6 characters (demo only: never use a real one).'); }
      var exists = db.all('users').some(function (u) { return u.email.toLowerCase() === email; });
      if (exists) { throw new Error('An account with that email already exists. Try logging in.'); }
      var user = { id: 'u_' + Date.now().toString(36), name: name, email: email, password: password, tier: 'new', created_at: nowIso() };
      db.insert('users', user);
      localStorage.setItem('kl_session', user.id);
      return user;
    },
    login: function (email, password) {
      email = (email || '').trim().toLowerCase();
      var user = db.all('users').filter(function (u) { return u.email.toLowerCase() === email && u.password === password; })[0];
      if (!user) { throw new Error('Email or password is incorrect.'); }
      localStorage.setItem('kl_session', user.id);
      return user;
    },
    logout: function () { localStorage.removeItem('kl_session'); }
  };

  /* =========================================================================
   * KL.store: cart, coupon and totals. Prices are always recomputed from products.js.
   * Cart shape in localStorage (kl_cart): { lines: [{ item_id, quantity }], coupon: 'CHAI10' | null }
   * ========================================================================= */
  function readCart() {
    var c = readStore('kl_cart', null);
    if (!c || !Array.isArray(c.lines)) { c = { lines: [], coupon: null }; }
    return c;
  }
  function writeCart(c) {
    localStorage.setItem('kl_cart', JSON.stringify(c));
    document.dispatchEvent(new CustomEvent('kl:cart'));
  }
  /** Turn a raw cart into priced lines and totals. */
  function compute(cart, shippingMethod) {
    var lines = [], subtotal = 0, count = 0;
    cart.lines.forEach(function (l) {
      var hit = catalog.find(l.item_id);
      if (!hit) { return; }
      var total = U.round2(hit.variant.price * l.quantity);
      lines.push({ item_id: l.item_id, quantity: l.quantity, product: hit.product, variant: hit.variant, price: hit.variant.price, line_total: total });
      subtotal += total; count += l.quantity;
    });
    subtotal = U.round2(subtotal);
    var discount = 0, couponNote = '', code = cart.coupon;
    var c = code ? COMMERCE.coupons[code] : null;
    if (c) {
      if (c.minSubtotal && subtotal <= c.minSubtotal) { couponNote = code + ' needs an order over ' + U.money(c.minSubtotal) + '.'; }
      else if (c.type === 'percent') { discount = U.round2(subtotal * c.value / 100); }
      else { discount = Math.min(c.value, subtotal); }
    }
    var method = shippingMethod === 'express' ? 'express' : 'standard';
    var shipping = 0;
    if (count > 0) {
      shipping = method === 'express' ? COMMERCE.shipping.express
        : (subtotal >= COMMERCE.freeShippingFrom ? 0 : COMMERCE.shipping.standard);
    }
    return {
      lines: lines, count: count, subtotal: subtotal, discount: discount, coupon: c && !couponNote ? code : (c ? code : null),
      couponNote: couponNote, shipping: shipping, shipping_method: method,
      total: U.round2(subtotal - discount + shipping), currency: COMMERCE.currency
    };
  }
  var store = KL.store = {
    raw: readCart,
    lines: function () { return compute(readCart()).lines; },
    count: function () { return compute(readCart()).count; },
    totals: function (opts) { return compute(readCart(), opts && opts.shipping_method); },
    add: function (itemId, qty) {
      qty = parseInt(qty, 10) || 1;
      var hit = catalog.find(itemId);
      if (!hit) { throw new Error('That product is not available.'); }
      if (!hit.variant.inStock) { throw new Error(hit.product.name + ' (' + hit.variant.label + ') is out of stock.'); }
      var c = readCart(), line = c.lines.filter(function (l) { return l.item_id === itemId; })[0];
      if (line) { line.quantity = Math.min(COMMERCE.maxQuantity, line.quantity + qty); }
      else { c.lines.push({ item_id: itemId, quantity: Math.min(COMMERCE.maxQuantity, Math.max(1, qty)) }); }
      writeCart(c);
    },
    update: function (itemId, qty) {
      qty = parseInt(qty, 10);
      if (isNaN(qty) || qty < 1) { return store.remove(itemId); }
      var c = readCart();
      c.lines.forEach(function (l) { if (l.item_id === itemId) { l.quantity = Math.min(COMMERCE.maxQuantity, qty); } });
      writeCart(c);
    },
    remove: function (itemId) {
      var c = readCart();
      c.lines = c.lines.filter(function (l) { return l.item_id !== itemId; });
      writeCart(c);
    },
    clear: function () { var c = readCart(); c.lines = []; c.coupon = null; writeCart(c); },
    applyCoupon: function (code) {
      code = (code || '').trim().toUpperCase();
      if (!code) { throw new Error('Enter a coupon code.'); }
      var c = COMMERCE.coupons[code];
      if (!c) { throw new Error('"' + code + '" is not a valid coupon code.'); }
      var cart = readCart(), t = compute(cart);
      if (t.count > 0 && c.minSubtotal && t.subtotal <= c.minSubtotal) {
        throw new Error(code + ' needs an order over ' + U.money(c.minSubtotal) + '.');
      }
      cart.coupon = code; writeCart(cart);
      return { code: code, label: c.label };
    },
    removeCoupon: function () { var c = readCart(); c.coupon = null; writeCart(c); }
  };

  /* =========================================================================
   * KL.webhooks: simulated server events, sent from the browser (no-cors). See README.
   * ========================================================================= */
  function sendWebhook(entry) {
    var url = KL.settings.get().webhookUrl;
    entry.target_url = url || '';
    if (!url) { return Promise.resolve('logged only'); }
    return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(entry.payload) })
      .then(function () { return 'sent (opaque response)'; })
      .catch(function (e) { return 'error: ' + (e && e.message ? e.message : e); });
  }
  var webhooks = KL.webhooks = {
    emit: function (event, order, extra) {
      extra = extra || {};
      var payload = {
        event: event, order_id: order.id, user_id: order.user_id, email: order.email, items: order.items,
        value: order.total, currency: order.currency, event_id: extra.event_id || order.event_id, timestamp: nowIso()
      };
      if (event === 'order.status_changed') { payload.order_status = order.status; }
      if (extra.refund) { payload.refund = extra.refund; payload.value = extra.refund.amount; }
      var entry = { id: 'WH-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), event: event, payload: payload, target_url: '', result: 'logged only', at: nowIso() };
      db.insert('webhooks', entry);
      sendWebhook(entry).then(function (result) { db.update('webhooks', entry.id, { result: result, target_url: entry.target_url }); });
      return entry;
    },
    resend: function (id) {
      var entry = db.get('webhooks', id);
      if (!entry) { throw new Error('Webhook entry not found.'); }
      return sendWebhook(entry).then(function (result) {
        db.update('webhooks', id, { result: result, target_url: entry.target_url, at: nowIso() });
      });
    },
    curl: function (entry) {
      var url = entry.target_url || KL.settings.get().webhookUrl || 'https://YOUR-ENDPOINT.example/collect';
      return "curl -X POST '" + url + "' -H 'Content-Type: text/plain' --data-raw '" + JSON.stringify(entry.payload).replace(/'/g, "'\\''") + "'";
    }
  };

  /* =========================================================================
   * KL.orders
   * ========================================================================= */
  function newOrderId() {
    var d = new Date(), pad = function (n) { return String(n).padStart(2, '0'); };
    var day = '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()), id;
    do { id = 'KL-' + day + '-' + String(Math.floor(Math.random() * 9000) + 1000); } while (db.get('orders', id));
    return id;
  }
  function byNewest(a, b) { return new Date(b.created_at) - new Date(a.created_at); }
  var orders = KL.orders = {
    FLOW: FLOW,
    isDelivered: function (o) { return DELIVERED_LIKE.indexOf(o.status) > -1; },
    /** create(cart, contact, shipping, method): cart = raw cart; contact {email, phone}; shipping {name,line1,...,method}; method = 'kettlepay' | 'cod' */
    create: function (cart, contact, shipping, method) {
      var t = compute(cart || readCart(), shipping && shipping.method);
      if (!t.count) { throw new Error('Your cart is empty.'); }
      if (method !== 'kettlepay' && method !== 'cod') { throw new Error('Choose a payment method.'); }
      var me = auth.current(), at = nowIso(), status = method === 'cod' ? 'placed' : 'pending_payment';
      var order = {
        id: newOrderId(), user_id: me ? me.id : null, email: (contact.email || '').trim().toLowerCase(),
        items: t.lines.map(function (l) {
          return { item_id: l.item_id, item_name: l.product.name, item_variant: l.variant.label, price: l.price, quantity: l.quantity };
        }),
        subtotal: t.subtotal, discount: t.discount, coupon: t.discount > 0 ? t.coupon : null,
        shipping: t.shipping, shipping_method: t.shipping_method, total: t.total, currency: t.currency,
        shipping_address: { name: shipping.name, line1: shipping.line1, city: shipping.city, region: shipping.region, postal_code: shipping.postal_code, country: shipping.country },
        phone: contact.phone || '', payment_method: method, payment_status: method === 'cod' ? 'cod' : 'pending',
        status: status, status_history: [{ status: status, at: at }],
        event_id: U.uuid(), created_at: at, webhooks_emitted: false
      };
      return db.insert('orders', order);
    },
    /** setPayment(id, 'paid' | 'declined'): only applies to orders still waiting for payment (so a reload changes nothing). */
    setPayment: function (id, result) {
      var o = db.get('orders', id);
      if (!o) { throw new Error('Order not found.'); }
      if (o.status !== 'pending_payment' && !(o.status === 'payment_failed' && result === 'paid')) { return o; }
      var history = o.status_history.slice();
      if (result === 'paid') {
        history.push({ status: 'placed', at: nowIso() });
        return db.update('orders', id, { payment_status: 'paid', status: 'placed', status_history: history });
      }
      history.push({ status: 'payment_failed', at: nowIso() });
      return db.update('orders', id, { payment_status: 'declined', status: 'payment_failed', status_history: history });
    },
    /** Let a shopper try KettlePay again on an order whose payment failed. */
    retryPayment: function (id) {
      var o = db.get('orders', id);
      if (!o || o.status !== 'payment_failed') { return o; }
      var history = o.status_history.slice(); history.push({ status: 'pending_payment', at: nowIso() });
      return db.update('orders', id, { payment_status: 'pending', status: 'pending_payment', status_history: history });
    },
    listForUser: function () {
      var me = auth.current();
      if (!me) { return []; }
      return db.all('orders').filter(function (o) { return o.user_id === me.id || (!o.user_id && o.email === me.email.toLowerCase()); }).sort(byNewest);
    },
    /** get(id, email?): the owner can always see it; guests need the matching email. */
    get: function (id, email) {
      var o = db.get('orders', (id || '').trim().toUpperCase());
      if (!o) { return null; }
      var me = auth.current();
      if (me && (o.user_id === me.id || o.email === me.email.toLowerCase())) { return o; }
      if (email && o.email === String(email).trim().toLowerCase()) { return o; }
      return null;
    },
    advance: function (id) {
      var o = db.get('orders', id);
      if (!o) { throw new Error('Order not found.'); }
      var i = FLOW.indexOf(o.status);
      if (o.status === 'pending_payment') { throw new Error('This order is still waiting for payment.'); }
      if (i < 0 || i >= FLOW.length - 1) { throw new Error('This order cannot be advanced from "' + U.statusLabel(o.status) + '".'); }
      var next = FLOW[i + 1], history = o.status_history.slice();
      history.push({ status: next, at: nowIso() });
      var updated = db.update('orders', id, { status: next, status_history: history });
      webhooks.emit('order.status_changed', updated, { event_id: U.uuid() });
      return updated;
    }
  };

  /* =========================================================================
   * KL.refunds
   * ========================================================================= */
  function refundedQty(orderId, itemId, includeRequested) {
    var n = 0;
    db.all('refunds').forEach(function (r) {
      if (r.order_id !== orderId || r.status === 'rejected') { return; }
      if (r.status === 'requested' && !includeRequested) { return; }
      r.items.forEach(function (i) { if (i.item_id === itemId) { n += i.quantity; } });
    });
    return n;
  }
  var refunds = KL.refunds = {
    REASONS: { damaged: 'Arrived damaged', wrong_item: 'Wrong item', not_as_described: 'Not as described', changed_mind: 'Changed my mind', other: 'Other' },
    /** How many of each line can still be refunded (not already requested or refunded). */
    refundable: function (order) {
      return order.items.map(function (i) {
        return { item: i, max: Math.max(0, i.quantity - refundedQty(order.id, i.item_id, true)) };
      });
    },
    canRequest: function (order) {
      return (order.status === 'delivered' || order.status === 'partially_refunded') && refunds.refundable(order).some(function (r) { return r.max > 0; });
    },
    forOrder: function (orderId) { return db.all('refunds').filter(function (r) { return r.order_id === orderId; }); },
    request: function (orderId, items, reason, note) {
      var o = db.get('orders', orderId);
      if (!o) { throw new Error('Order not found.'); }
      if (o.status !== 'delivered' && o.status !== 'partially_refunded') { throw new Error('Refunds can only be requested on delivered orders.'); }
      if (!refunds.REASONS[reason]) { throw new Error('Please choose a reason.'); }
      var lines = [], amount = 0, avail = refunds.refundable(o);
      (items || []).forEach(function (req) {
        var qty = parseInt(req.quantity, 10) || 0;
        if (qty < 1) { return; }
        var row = avail.filter(function (a) { return a.item.item_id === req.item_id; })[0];
        if (!row) { throw new Error('That item is not on this order.'); }
        if (qty > row.max) { throw new Error('Only ' + row.max + ' of ' + row.item.item_name + ' (' + row.item.item_variant + ') can still be refunded.'); }
        lines.push({ item_id: row.item.item_id, quantity: qty, price: row.item.price });
        amount += row.item.price * qty;
      });
      if (!lines.length) { throw new Error('Select at least one item to refund.'); }
      var max = db.all('refunds').reduce(function (m, r) { return Math.max(m, parseInt(String(r.id).replace('RF-', ''), 10) || 0); }, 1000);
      var refund = {
        id: 'RF-' + (max + 1), order_id: orderId, user_id: o.user_id, items: lines, amount: U.round2(amount),
        reason: reason, note: note || '', status: 'requested', requested_at: nowIso(), decided_at: null, event_id: U.uuid()
      };
      return db.insert('refunds', refund);
    },
    /** decide(id, 'approved' | 'rejected'). Approval moves the order to refunded or partially_refunded. */
    decide: function (id, decision) {
      var r = db.get('refunds', id);
      if (!r) { throw new Error('Refund not found.'); }
      if (r.status !== 'requested') { throw new Error('This refund was already ' + r.status + '.'); }
      if (decision !== 'approved' && decision !== 'rejected') { throw new Error('Decision must be approved or rejected.'); }
      var updated = db.update('refunds', id, { status: decision, decided_at: nowIso() });
      var order = db.get('orders', r.order_id);
      if (decision === 'approved') {
        var full = order.items.every(function (i) { return refundedQty(order.id, i.item_id, false) >= i.quantity; });
        var status = full ? 'refunded' : 'partially_refunded', history = order.status_history.slice();
        history.push({ status: status, at: nowIso() });
        order = db.update('orders', order.id, { status: status, status_history: history });
        webhooks.emit('refund.approved', order, { refund: updated, event_id: updated.event_id });
      }
      return { refund: updated, order: order };
    }
  };

  /* =========================================================================
   * KL.reviews
   * ========================================================================= */
  var reviews = KL.reviews = {
    list: function (productId) {
      var rows = db.all('reviews').filter(function (r) { return r.product_id === productId; });
      var breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, sum = 0;
      rows.forEach(function (r) { breakdown[r.rating]++; sum += r.rating; });
      return { reviews: rows, count: rows.length, average: rows.length ? Math.round(sum / rows.length * 10) / 10 : 0, breakdown: breakdown };
    },
    hasReviewed: function (productId) {
      var me = auth.current();
      return !!me && db.all('reviews').some(function (r) { return r.product_id === productId && r.user_id === me.id; });
    },
    isVerifiedBuyer: function (productId) {
      var me = auth.current();
      if (!me) { return false; }
      return db.all('orders').some(function (o) {
        return o.user_id === me.id && DELIVERED_LIKE.indexOf(o.status) > -1 &&
          o.items.some(function (i) { return i.item_id.indexOf(productId + '-') === 0; });
      });
    },
    add: function (productId, rating, title, body) {
      var me = auth.current();
      if (!me) { throw new Error('Please log in to write a review.'); }
      rating = parseInt(rating, 10);
      if (!(rating >= 1 && rating <= 5)) { throw new Error('Please choose a star rating.'); }
      title = (title || '').trim(); body = (body || '').trim();
      if (!title) { throw new Error('Please add a short title.'); }
      if (body.length < 10) { throw new Error('Please write at least a sentence or two.'); }
      if (reviews.hasReviewed(productId)) { throw new Error('You have already reviewed this tea.'); }
      var max = db.all('reviews').reduce(function (m, r) { return Math.max(m, parseInt(String(r.id).replace('RV-', ''), 10) || 0); }, 1000);
      var parts = me.name.split(' ');
      var review = {
        id: 'RV-' + (max + 1), product_id: productId, user_id: me.id,
        user_name: parts[0] + (parts[1] ? ' ' + parts[1].charAt(0) + '.' : ''),
        rating: rating, title: title, body: body, verified_buyer: reviews.isVerifiedBuyer(productId), created_at: nowIso()
      };
      return db.insert('reviews', review);
    }
  };
})();
