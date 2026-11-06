/* Account page: profile and My orders. Requires login. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var me = KL.auth.current();
  if (!me) { location.replace('login.html?next=' + encodeURIComponent('account.html')); return; }

  function render() {
    $('#account-name').textContent = me.name;
    $('#account-email').textContent = me.email;
    $('#account-tier').textContent = me.tier;
    var rows = KL.orders.listForUser();
    $('#orders-body').innerHTML = rows.length ? rows.map(function (o) {
      var n = o.items.reduce(function (t, i) { return t + i.quantity; }, 0);
      return '<tr data-order-id="' + o.id + '" data-order-status="' + o.status + '"><td><span class="order-id">' + o.id + '</span></td><td>' + U.fmtDate(o.created_at) + '</td><td>' + n + '</td><td>' + U.money(o.total) + '</td><td>' + KL.ui.badge(o.status) + '</td>' +
        '<td><a href="order.html?id=' + o.id + '" data-track="account-order-view" id="view-' + o.id + '">View</a></td></tr>';
    }).join('') : '<tr><td colspan="6" class="muted">No orders yet. <a href="shop.html">Start shopping</a>.</td></tr>';
  }
  document.addEventListener('kl:db', render);
  render();

  $('#logout-button').addEventListener('click', function () {
    KL.dl.logout(); KL.auth.logout(); location.href = 'index.html';
  });
})();
