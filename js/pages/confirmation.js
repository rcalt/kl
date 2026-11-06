/*
 * Order confirmation. Reads ?order= and ?status= (paid | declined | cod).
 * - declined: sends the shopper back to checkout (payment step) with an error.
 * - otherwise: records the payment, shows the order, fires purchase and the order.created / order.paid webhooks.
 * Reloading this page is the duplicate-purchase demo (see the Dedupe guard toggle in the demo panel).
 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var id = (U.param('order') || '').toUpperCase(), status = U.param('status');
  var root = $('#confirmation-root');

  function checkoutEmail() { try { return (JSON.parse(sessionStorage.getItem('kl_checkout') || '{}').contact || {}).email; } catch (e) { return null; } }

  var order = id ? KL.orders.get(id, checkoutEmail()) : null;
  if (!order) {
    root.innerHTML = '<div class="empty-state"><h2>We could not find that order</h2><p>Try tracking it with your order number and email.</p><a class="btn btn--primary" id="confirmation-track" href="track-order.html" data-track="confirmation-track">Track an order</a></div>';
    return;
  }

  if (order.payment_method === 'kettlepay' && (status === 'paid' || status === 'declined')) {
    order = KL.orders.setPayment(order.id, status);
  }
  if (order.status === 'payment_failed' || status === 'declined') {
    location.replace('checkout.html?step=payment&error=declined');
    return;
  }
  if (order.status === 'pending_payment') {
    root.innerHTML = '<div class="empty-state"><h2>Waiting for payment</h2><p>This order has not been paid yet.</p><a class="btn btn--primary" id="confirmation-resume" href="checkout.html?step=payment" data-track="confirmation-resume">Back to checkout</a></div>';
    return;
  }

  if (order.payment_method === 'kettlepay') { KL.store.clear(); }

  var a = order.shipping_address;
  root.innerHTML =
    '<div class="alert alert--success" id="confirmation-banner"><strong>Thank you!</strong> Your order is confirmed.</div>' +
    '<div class="card" data-order-id="' + order.id + '"><p class="muted">Order number</p><p style="font-size:1.4rem"><span class="order-id" id="confirmation-order-id">' + order.id + '</span></p>' +
    '<div class="table-wrap"><table class="table"><tbody>' + order.items.map(function (i) {
      return '<tr><td>' + U.esc(i.item_name) + ' (' + U.esc(i.item_variant) + ')</td><td>×' + i.quantity + '</td><td>' + U.money(i.price * i.quantity) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<p>Subtotal ' + U.money(order.subtotal) + (order.discount ? ' · Discount −' + U.money(order.discount) : '') + ' · Shipping ' + U.money(order.shipping) + ' · <strong>Total ' + U.money(order.total) + '</strong></p>' +
    '<p class="muted">Shipping to ' + U.esc([a.name, a.line1, a.city, a.region, a.postal_code, a.country].join(', ')) + '<br>Payment: ' +
    (order.payment_method === 'cod' ? 'Cash on delivery' : 'KettlePay (card), paid') + '</p>' +
    '<a class="btn btn--primary" id="confirmation-track-order" href="order.html?id=' + order.id + '" data-track="confirmation-track-order">Track this order</a></div>' +
    (order.user_id ? '' : '<div class="card" style="margin-top:1rem"><h3>Create an account to track all your orders</h3><p>It takes a few seconds.</p><a class="btn btn--ghost" id="confirmation-signup" href="login.html?signup=1&email=' + encodeURIComponent(order.email) + '&name=' + encodeURIComponent(a.name) + '&next=' + encodeURIComponent('account.html') + '" data-track="confirmation-signup">Create account</a></div>');

  // Webhooks fire once per order (the browser event purchase is guarded separately by the dedupe toggle).
  if (!order.webhooks_emitted) {
    KL.db.update('orders', order.id, { webhooks_emitted: true });
    KL.webhooks.emit('order.created', order);
    if (order.payment_status === 'paid') { KL.webhooks.emit('order.paid', order); }
  }
  KL.dl.purchase(order);
})();
