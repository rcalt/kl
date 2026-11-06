/*
 * consent-mock.js: the mock cookie banner. Off by default (the course installs a real CMP through GTM).
 * When it is On in the demo panel, boot.js has already set Consent Mode defaults (all denied except security_storage);
 * the buttons here send consent updates and remember the choice in localStorage (kl_consent).
 */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  if (!KL.settings.get().consent) { return; }
  var decided = null;
  try { decided = localStorage.getItem('kl_consent'); } catch (e) { /* ignore */ }
  if (decided) { return; }

  function update(analytics, marketing) {
    var state = {
      analytics_storage: analytics ? 'granted' : 'denied',
      functionality_storage: analytics ? 'granted' : 'denied',
      personalization_storage: marketing ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied'
    };
    window.gtag('consent', 'update', state);
    try { localStorage.setItem('kl_consent', JSON.stringify(state)); } catch (e) { /* ignore */ }
    box.remove();
  }

  var box = document.createElement('div');
  box.id = 'consent-banner';
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookie consent');
  box.style.cssText = 'position:fixed;left:1rem;right:1rem;bottom:1rem;max-width:640px;margin:0 auto;background:#fff;border:1px solid #C49A2C;border-radius:10px;padding:1.1rem;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:250;font-size:.92rem';
  box.innerHTML =
    '<p style="margin:0 0 .7rem"><strong>We use cookies.</strong> This is a mock banner for the course. Choose what you allow.</p>' +
    '<div id="consent-custom" hidden style="margin-bottom:.7rem">' +
    '<label class="check"><input type="checkbox" id="consent-analytics"> Analytics</label>' +
    '<label class="check"><input type="checkbox" id="consent-marketing"> Marketing</label>' +
    '<button type="button" class="btn btn--primary btn--small" id="consent-save" data-track="consent-save" style="margin-top:.5rem">Save choices</button></div>' +
    '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
    '<button type="button" class="btn btn--primary btn--small" id="consent-accept" data-track="consent-accept">Accept all</button>' +
    '<button type="button" class="btn btn--ghost btn--small" id="consent-reject" data-track="consent-reject">Reject all</button>' +
    '<button type="button" class="btn btn--ghost btn--small" id="consent-customise" data-track="consent-customise">Customise</button></div>';

  function mount() {
    document.body.appendChild(box);
    box.querySelector('#consent-accept').addEventListener('click', function () { update(true, true); });
    box.querySelector('#consent-reject').addEventListener('click', function () { update(false, false); });
    box.querySelector('#consent-customise').addEventListener('click', function () { box.querySelector('#consent-custom').hidden = false; });
    box.querySelector('#consent-save').addEventListener('click', function () {
      update(box.querySelector('#consent-analytics').checked, box.querySelector('#consent-marketing').checked);
    });
  }
  if (document.body) { mount(); } else { document.addEventListener('DOMContentLoaded', mount); }
})();
