/*
 * Tea tasting: embeds the booking widget (a third origin) in an iframe and listens for its postMessage.
 * We pass our own origin as ?parent=, and only accept messages whose event.origin is the widget's origin.
 */
(function () {
  'use strict';
  var KL = window.KL, $ = KL.$;
  var widget = new URL(KL.urls.booking());
  widget.searchParams.set('parent', location.origin);
  var frame = $('#booking-frame');
  frame.src = widget.href;

  window.addEventListener('message', function (e) {
    if (e.origin !== widget.origin) { return; }
    var d = e.data;
    if (!d || d.type !== 'tasting_booked') { return; }
    KL.dl.tastingBooked({ slot: d.slot, date: d.date });
    $('#tasting-confirmation').hidden = false;
    $('#tasting-confirmation').textContent = 'Booked: ' + d.date + ' at ' + d.slot + '. See you then!';
  });
})();
