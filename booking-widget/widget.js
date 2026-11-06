/*
 * Booking widget (third origin, shown in an iframe on tea-tasting.html).
 * On "Book" it sends window.parent.postMessage({ type: 'tasting_booked', slot, date }, parentOrigin).
 * parentOrigin comes from ?parent= (the store passes its own origin).
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search), parentOrigin = null;
  try { parentOrigin = new URL(params.get('parent') || '').origin; } catch (e) { parentOrigin = null; }

  function $(id) { return document.getElementById(id); }
  // Default the date to tomorrow
  var d = new Date(Date.now() + 86400000);
  $('bw-date').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  $('booking-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var date = $('bw-date').value, slot = $('bw-slot').value, name = $('bw-name').value.trim(), email = $('bw-email').value.trim();
    if (!date || !slot || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      $('booking-error').innerHTML = '<p class="bw__err" role="alert">Please fill in every field with a valid email.</p>';
      return;
    }
    $('booking-error').innerHTML = '';
    if (window.parent !== window && parentOrigin) {
      window.parent.postMessage({ type: 'tasting_booked', slot: slot, date: date }, parentOrigin);
    }
    $('booking-form').hidden = true;
    var done = $('booking-done'); done.hidden = false;
    done.textContent = 'Thanks ' + name + '! Your tasting is booked for ' + date + ' at ' + slot + '.';
  });
})();
