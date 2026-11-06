/* Order detail (order.html?id=): timeline, items, refunds. Updates live when the admin tab changes the order. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var id = (U.param('id') || '').toUpperCase(), root = $('#order-root');

  if (!KL.auth.current()) {
    root.innerHTML = '<div class="alert alert--info">Please <a href="login.html?next=' + encodeURIComponent('order.html?id=' + id) + '" id="order-login" data-track="order-login">log in</a> to see this order, or <a href="track-order.html" data-track="order-guest-track">track it as a guest</a>.</div>';
    return;
  }
  var order = KL.ui.mountOrder(root, id, null);
  if (order) { KL.dl.orderTracked(order); }
})();
