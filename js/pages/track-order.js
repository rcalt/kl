/* Track order: guests enter order ID + email. Shows the same timeline and refund option. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var form = $('#track-form');

  function lookup(id, email) {
    var out = $('#track-result');
    out.innerHTML = '';
    var order = KL.orders.get(id, email);
    if (!order) { out.innerHTML = '<div class="form-error" role="alert" id="track-error">We could not find an order with that number and email.</div>'; return; }
    KL.ui.mountOrder(out, order.id, email);
    KL.dl.orderTracked(order);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    lookup($('#track-id').value, $('#track-email').value);
  });
  var me = KL.auth.current();
  if (U.param('id')) { $('#track-id').value = U.param('id'); }
  if (U.param('email')) { $('#track-email').value = U.param('email'); }
  else if (me) { $('#track-email').value = me.email; }
  if ($('#track-id').value && $('#track-email').value) { lookup($('#track-id').value, $('#track-email').value); }
})();
