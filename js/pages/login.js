/* Login and sign up. Supports ?next= (same-site only) and ?signup=1&email=&name= prefill. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var next = U.safeNext(U.param('next'));

  function done(user) { location.href = next || 'account.html'; }
  function err(id, msg) { $('#' + id).innerHTML = msg ? '<div class="form-error" role="alert">' + U.esc(msg) + '</div>' : ''; }

  if (KL.auth.current()) { done(); return; }

  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    try {
      var u = KL.auth.login($('#login-email').value, $('#login-password').value);
      KL.dl.login(u); done(u);
    } catch (ex) { err('login-error', ex.message); }
  });
  $('#signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    try {
      var u = KL.auth.signup($('#signup-name').value, $('#signup-email').value, $('#signup-password').value);
      KL.dl.signUp(u); done(u);
    } catch (ex) { err('signup-error', ex.message); }
  });

  // Demo account quick-fill buttons
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-demo-email]');
    if (!b) { return; }
    $('#login-email').value = b.getAttribute('data-demo-email');
    $('#login-password').value = 'tea123';
    $('#login-submit').focus();
  });

  if (U.param('signup') === '1') {
    $('#signup-email').value = U.param('email') || '';
    $('#signup-name').value = U.param('name') || '';
    $('#signup-password').focus();
  }
  if (next) { $('#login-note').textContent = 'Log in to continue.'; }
})();
