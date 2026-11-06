/*
 * demo-panel.js: the floating teaching panel. Hidden by default.
 * Open with ?demo=1 (remembered) or Ctrl+Shift+D. Settings are saved in localStorage (kl_demo_settings).
 */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  var U = KL.util;
  var panel = null;

  function esc(s) { return U.esc(s); }
  function cfg() { return window.KL_CONFIG || {}; }

  function seg(name, options, current) {
    return '<span class="dp__seg" data-seg="' + name + '">' + options.map(function (o) {
      return '<button type="button" data-val="' + o[0] + '" class="' + (String(current) === String(o[0]) ? 'is-on' : '') + '">' + o[1] + '</button>';
    }).join('') + '</span>';
  }

  function logHtml() {
    if (!KL.dl.log.length) { return '<p class="dp__note">Nothing pushed yet on this tab.</p>'; }
    return KL.dl.log.slice(0, 40).map(function (e, i) {
      var name = e.data && e.data.event ? e.data.event : (e.data && e.data.ecommerce === null ? 'ecommerce: null' : '(data)');
      var json = JSON.stringify(e.data, null, 2);
      return '<details><summary><b>' + esc(name) + '</b><span class="dp__time">' + new Date(e.at).toLocaleTimeString() + '</span></summary>' +
        '<pre>' + esc(json) + '</pre><button type="button" data-copy-log="' + i + '">Copy</button></details>';
    }).join('');
  }

  function render() {
    var s = KL.settings.get(), user = KL.user || {};
    var openIds = [];
    if (panel) { panel.querySelectorAll('.dp__log details[open]').forEach(function (d, i) { openIds.push(i); }); }
    panel.innerHTML =
      '<div class="dp__head"><strong>DEMO PANEL</strong><button type="button" data-act="close">Close (Ctrl+Shift+D)</button></div>' +
      '<section><h4>GTM container</h4>' +
      '<input type="text" id="dp-gtm" placeholder="GTM-XXXXXXX" value="' + esc(KL.gtm.configured ? KL.gtm.id : '') + '">' +
      '<button type="button" data-act="apply-gtm">Apply and reload</button>' +
      '<p class="dp__note">Or add <code>?gtm=GTM-XXXXXXX</code> to any URL once.</p>' +
      (KL.gtm.configured ? '' : '<p class="dp__warn">No GTM container set. The GTM snippet is skipped.</p>') + '</section>' +
      '<section><h4>Data layer log</h4><div class="dp__log" id="dp-log">' + logHtml() + '</div></section>' +
      '<section><h4>Toggles</h4>' +
      '<div class="dp__row"><span>Data layer</span>' + seg('dataLayer', [[true, 'On'], [false, 'Off']], s.dataLayer) + '</div>' +
      '<div class="dp__row"><span>Purchase dedupe guard</span>' + seg('dedupe', [[true, 'On'], [false, 'Off']], s.dedupe) + '</div>' +
      '<div class="dp__row"><span>Mock consent banner</span>' + seg('consent', [[true, 'On'], [false, 'Off']], s.consent) + '</div>' +
      '<div class="dp__row"><span>Bug mode</span>' + seg('bug', [[true, 'On'], [false, 'Off']], s.bug) + '</div>' +
      '<div class="dp__row"><span>A/B variant</span>' + seg('ab', [['A', 'Force A'], ['B', 'Force B'], ['random', 'Random']], s.ab) + '</div>' +
      '<p class="dp__note">Consent and A/B changes apply after a reload (done for you).</p></section>' +
      '<section><h4>URLs</h4>' +
      '<label>Gateway URL</label><input type="text" id="dp-gateway" value="' + esc(s.gatewayUrl) + '" placeholder="' + esc(cfg().gatewayUrl) + '">' +
      '<label>Booking widget URL</label><input type="text" id="dp-booking" value="' + esc(s.bookingUrl) + '" placeholder="' + esc(cfg().bookingUrl) + '">' +
      '<label>Webhook URL</label><input type="text" id="dp-webhook" value="' + esc(s.webhookUrl) + '" placeholder="https://your-endpoint.example/collect">' +
      '<button type="button" data-act="save-urls">Save URLs</button></section>' +
      '<section><h4>Quick actions</h4>' +
      '<button type="button" data-login="priya@example.com">Log in as Priya</button>' +
      '<button type="button" data-login="arjun@example.com">Arjun</button>' +
      '<button type="button" data-login="meera@example.com">Meera</button>' +
      '<button type="button" data-act="logout">Log out</button>' +
      '<button type="button" data-act="clear-cart">Clear cart</button>' +
      '<button type="button" data-act="fill-checkout">Fill checkout with test data</button>' +
      '<button type="button" data-act="open-admin">Open admin</button>' +
      '<button type="button" class="dp__danger" data-act="reset">Reset all demo data</button></section>' +
      '<section><h4>Info</h4><dl class="dp__info">' +
      '<dt>GTM container</dt><dd>' + esc(KL.gtm.configured ? KL.gtm.id : 'none') + '</dd>' +
      '<dt>Page type</dt><dd>' + esc(KL.pageType) + '</dd>' +
      '<dt>User</dt><dd>' + (user.loggedIn ? esc(user.name + ' (' + user.id + ', ' + user.tier + ')') : 'logged out') + '</dd>' +
      '<dt>Data layer</dt><dd>' + (s.dataLayer ? 'on' : 'off') + '</dd>' +
      '<dt>A/B variant</dt><dd>' + esc(KL.abVariant) + '</dd>' +
      '<dt>Visitor type</dt><dd>' + esc(KL.visitorType) + '</dd>' +
      '<dt>Origin</dt><dd>' + esc(location.origin) + '</dd></dl></section>';
    var details = panel.querySelectorAll('.dp__log details');
    openIds.forEach(function (i) { if (details[i]) { details[i].open = true; } });
  }

  function setOpen(open) {
    KL.settings.set({ demoOpen: open });
    if (open) { if (!panel) { build(); } panel.hidden = false; render(); }
    else if (panel) { panel.hidden = true; }
  }

  function fillCheckout() {
    var data = {
      contact: { email: 'test.shopper@example.com', phone: '+15555550100', create_account: false },
      shipping: { name: 'Test Shopper', line1: '1 Demo Street', city: 'Austin', region: 'TX', postal_code: '78701', country: 'US', method: 'standard' },
      method: 'kettlepay'
    };
    try { sessionStorage.setItem('kl_checkout', JSON.stringify(data)); } catch (e) { /* ignore */ }
    KL.ui.toast('Checkout prefilled with test data.');
    if (KL.page === 'checkout') { location.reload(); }
  }

  function build() {
    panel = document.createElement('div');
    panel.id = 'demo-panel'; panel.className = 'dp'; panel.hidden = true;
    panel.setAttribute('aria-label', 'Demo panel');
    document.body.appendChild(panel);

    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) { return; }
      var act = b.getAttribute('data-act'), segEl = b.closest('[data-seg]');
      if (segEl) {
        var name = segEl.getAttribute('data-seg'), raw = b.getAttribute('data-val'), val = raw === 'true' ? true : raw === 'false' ? false : raw, patch = {};
        patch[name] = val; KL.settings.set(patch);
        if (name === 'consent' || name === 'ab') { location.reload(); } else { render(); }
        return;
      }
      if (b.hasAttribute('data-login')) {
        try { var u = KL.auth.login(b.getAttribute('data-login'), 'tea123'); KL.dl.login(u); } catch (err) { KL.ui.toast(err.message, 'error'); return; }
        location.reload(); return;
      }
      if (b.hasAttribute('data-copy-log')) {
        U.copy(JSON.stringify(KL.dl.log[parseInt(b.getAttribute('data-copy-log'), 10)].data, null, 2)).then(function () { KL.ui.toast('Copied.'); });
        return;
      }
      if (act === 'close') { setOpen(false); }
      if (act === 'apply-gtm') {
        var v = panel.querySelector('#dp-gtm').value.trim().toUpperCase();
        if (!/^GTM-[A-Z0-9]{4,}$/.test(v)) { KL.ui.toast('Enter an ID like GTM-ABC1234', 'error'); return; }
        localStorage.setItem('kl_gtm_id', v); location.reload();
      }
      if (act === 'save-urls') {
        KL.settings.set({ gatewayUrl: panel.querySelector('#dp-gateway').value.trim(), bookingUrl: panel.querySelector('#dp-booking').value.trim(), webhookUrl: panel.querySelector('#dp-webhook').value.trim() });
        KL.ui.toast('URLs saved.');
      }
      if (act === 'logout') { KL.auth.logout(); location.reload(); }
      if (act === 'clear-cart') { KL.store.clear(); KL.ui.toast('Cart cleared.'); }
      if (act === 'fill-checkout') { fillCheckout(); }
      if (act === 'open-admin') { window.open('admin.html', '_blank'); }
      if (act === 'reset') {
        if (window.confirm('Wipe all demo data (orders, accounts, cart, session) and re-seed?')) {
          KL.db.reset(); location.href = 'index.html';
        }
      }
    });
  }

  /** Mini helpers other pages use: resolved URLs from settings with config defaults. */
  KL.urls = {
    gateway: function () { return new URL(KL.settings.get().gatewayUrl || cfg().gatewayUrl, location.href).href; },
    booking: function () { return new URL(KL.settings.get().bookingUrl || cfg().bookingUrl, location.href).href; }
  };

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) { e.preventDefault(); setOpen(!(panel && !panel.hidden)); }
  });
  document.addEventListener('kl:dlpush', function () {
    if (panel && !panel.hidden) { var log = panel.querySelector('#dp-log'); if (log) { log.innerHTML = logHtml(); } }
  });

  if (KL.settings.get().demoOpen) { build(); panel.hidden = false; render(); }
})();
