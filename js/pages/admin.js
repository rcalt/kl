/*
 * Demo admin: no login, not part of the store. Three tabs: Orders, Refunds, Webhooks.
 * This is how the presenter moves an order along on camera and how refunds reach GA4 and ad platforms.
 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$, $$ = KL.$$;
  var tab = 'orders';

  function renderOrders() {
    var rows = KL.db.all('orders').sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    $('#admin-orders-body').innerHTML = rows.map(function (o) {
      var can = KL.orders.FLOW.indexOf(o.status) > 0 && o.status !== 'delivered';
      return '<tr data-order-id="' + o.id + '" data-order-status="' + o.status + '"><td><span class="order-id">' + o.id + '</span></td><td>' + U.esc(o.email) + '</td><td>' + U.money(o.total) + '</td><td>' + KL.ui.badge(o.status) + '</td>' +
        '<td>' + (can ? '<button type="button" class="btn btn--primary btn--small" data-advance="' + o.id + '" data-track="admin-advance-' + o.id + '">Advance status</button>' : '<span class="muted">–</span>') + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">No orders.</td></tr>';
  }
  function renderRefunds() {
    var rows = KL.db.all('refunds').sort(function (a, b) { return new Date(b.requested_at) - new Date(a.requested_at); });
    $('#admin-refunds-body').innerHTML = rows.map(function (r) {
      return '<tr data-refund-id="' + r.id + '"><td><span class="order-id">' + r.id + '</span></td><td><span class="order-id">' + r.order_id + '</span></td><td>' + U.money(r.amount) + '</td><td>' + U.esc(KL.refunds.REASONS[r.reason] || r.reason) + '</td><td>' + KL.ui.badge(r.status) + '</td>' +
        '<td>' + (r.status === 'requested' ? '<button type="button" class="btn btn--primary btn--small" data-decide="approved" data-id="' + r.id + '" data-track="admin-refund-approve">Approve</button> <button type="button" class="btn btn--ghost btn--small" data-decide="rejected" data-id="' + r.id + '" data-track="admin-refund-reject">Reject</button>' : '<span class="muted">' + U.fmtDate(r.decided_at) + '</span>') + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">No refund requests.</td></tr>';
  }
  function renderWebhooks() {
    var rows = KL.db.all('webhooks').sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    var open = $$('#admin-webhooks details[open]').map(function (d) { return d.getAttribute('data-id'); });
    $('#admin-webhooks').innerHTML = rows.map(function (w) {
      return '<details class="webhook-row" data-id="' + w.id + '"' + (open.indexOf(w.id) > -1 ? ' open' : '') + '><summary><strong>' + U.esc(w.event) + '</strong><span class="order-id">' + U.esc(w.payload.order_id) + '</span><span class="muted">' + U.fmtDateTime(w.at) + '</span><span class="badge">' + U.esc(w.result) + '</span></summary>' +
        '<pre class="payload">' + U.esc(JSON.stringify(w.payload, null, 2)) + '</pre>' +
        '<div class="webhook-row__actions"><button type="button" class="btn btn--ghost btn--small" data-wh="copy" data-id="' + w.id + '" data-track="admin-wh-copy">Copy payload</button>' +
        '<button type="button" class="btn btn--ghost btn--small" data-wh="curl" data-id="' + w.id + '" data-track="admin-wh-curl">Copy as cURL</button>' +
        '<button type="button" class="btn btn--ghost btn--small" data-wh="resend" data-id="' + w.id + '" data-track="admin-wh-resend">Resend</button></div></details>';
    }).join('') || '<p class="muted">No webhooks yet. Place or advance an order to see them here.</p>';
  }
  function render() { renderOrders(); renderRefunds(); renderWebhooks(); }

  function showTab(name) {
    tab = name;
    $$('.admin-panel').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== name; });
    $$('[data-tab]').forEach(function (b) { b.classList.toggle('btn--primary', b.getAttribute('data-tab') === name); b.classList.toggle('btn--ghost', b.getAttribute('data-tab') !== name); });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) { return; }
    try {
      if (t.hasAttribute('data-tab')) { showTab(t.getAttribute('data-tab')); }
      if (t.hasAttribute('data-advance')) { KL.orders.advance(t.getAttribute('data-advance')); KL.ui.toast('Order advanced.'); }
      if (t.hasAttribute('data-decide')) {
        var res = KL.refunds.decide(t.getAttribute('data-id'), t.getAttribute('data-decide'));
        if (res.refund.status === 'approved') { KL.dl.refund(res.refund, res.order); }
        KL.ui.toast('Refund ' + res.refund.status + '.');
      }
      var wh = t.getAttribute('data-wh');
      if (wh) {
        var entry = KL.db.get('webhooks', t.getAttribute('data-id'));
        if (wh === 'copy') { U.copy(JSON.stringify(entry.payload, null, 2)).then(function () { KL.ui.toast('Payload copied.'); }); }
        if (wh === 'curl') { U.copy(KL.webhooks.curl(entry)).then(function () { KL.ui.toast('cURL command copied.'); }); }
        if (wh === 'resend') { KL.webhooks.resend(entry.id).then(function () { KL.ui.toast('Resent.'); }); }
      }
    } catch (err) { KL.ui.toast(err.message, 'error'); }
  });
  document.addEventListener('kl:db', render);
  render(); showTab(tab);
})();
