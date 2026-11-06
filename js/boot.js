/*
 * boot.js: runs synchronously in <head>, BEFORE the GTM snippet.
 * Sets up: window.KL globals, demo settings, GTM container ID, cookies, consent defaults, data layer init.
 */
(function () {
  'use strict';
  var cfg = window.KL_CONFIG || {};
  var KL = window.KL = window.KL || {};

  /* ---------- tiny storage helpers (safe if storage is blocked) ---------- */
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function readJSON(k, fallback) { try { var v = lsGet(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }

  /* ---------- demo settings (kl_demo_settings) ---------- */
  var DEFAULTS = {
    demoOpen: false,        // demo panel visible
    dataLayer: true,        // data layer on/off (off = Basics mode)
    dedupe: true,           // purchase dedupe guard
    consent: false,         // mock consent banner
    bug: false,             // bug mode
    ab: 'random',           // 'A' | 'B' | 'random'
    gatewayUrl: '',         // empty = use config.js default
    bookingUrl: '',
    webhookUrl: ''
  };
  KL.settings = {
    get: function () {
      var saved = readJSON('kl_demo_settings', {}), out = {}, k;
      for (k in DEFAULTS) { out[k] = (k in saved) ? saved[k] : DEFAULTS[k]; }
      return out;
    },
    set: function (patch) {
      var saved = readJSON('kl_demo_settings', {}), k;
      for (k in patch) { saved[k] = patch[k]; }
      lsSet('kl_demo_settings', JSON.stringify(saved));
      return KL.settings.get();
    }
  };
  var settings = KL.settings.get();

  /* ---------- URL parameters ---------- */
  var params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') { settings = KL.settings.set({ demoOpen: true }); }
  if (params.get('demo') === '0') { settings = KL.settings.set({ demoOpen: false }); }

  /* ---------- GTM container ID: ?gtm= then kl_gtm_id then config.js ---------- */
  var PLACEHOLDER = 'GTM-XXXXXXX';
  var GTM_RE = /^GTM-[A-Z0-9]{4,}$/i;
  var fromUrl = (params.get('gtm') || '').trim();
  if (GTM_RE.test(fromUrl)) { lsSet('kl_gtm_id', fromUrl.toUpperCase()); }
  var gtmId = lsGet('kl_gtm_id') || cfg.gtmId || PLACEHOLDER;
  var gtmOk = GTM_RE.test(gtmId) && gtmId.toUpperCase() !== PLACEHOLDER;
  KL.gtm = { id: gtmId, configured: gtmOk };
  // The GTM snippet below reads window.KL_GTM_ID. Empty string = skip the snippet.
  window.KL_GTM_ID = gtmOk ? gtmId : '';
  window.KL_GTM_ENV = (gtmOk && cfg.gtmAuth && cfg.gtmPreview)
    ? '&gtm_auth=' + encodeURIComponent(cfg.gtmAuth) + '&gtm_preview=' + encodeURIComponent(cfg.gtmPreview) + '&gtm_cookies_win=x'
    : '';

  /* ---------- cookies ---------- */
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value, days) {
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + (days * 86400) + '; SameSite=Lax';
  }
  var seenThisSession = false;
  try { seenThisSession = !!window.sessionStorage.getItem('kl_seen'); window.sessionStorage.setItem('kl_seen', '1'); } catch (e) { /* ignore */ }

  // kl_visitor_type: 'new' on the first visit, 'returning' from the next browser session on.
  var visitor = getCookie('kl_visitor_type');
  if (!visitor) { visitor = 'new'; }
  else if (visitor === 'new' && !seenThisSession) { visitor = 'returning'; }
  setCookie('kl_visitor_type', visitor, 30);

  // kl_ab_variant: 'A' or 'B' (B changes the home hero headline). The demo panel can force one.
  var ab = getCookie('kl_ab_variant');
  if (settings.ab === 'A' || settings.ab === 'B') { ab = settings.ab; }
  else if (ab !== 'A' && ab !== 'B') { ab = Math.random() < 0.5 ? 'A' : 'B'; }
  setCookie('kl_ab_variant', ab, 30);

  /* ---------- page globals (JS Variable demo) ---------- */
  var page = document.documentElement.getAttribute('data-page') || '';
  var TYPES = {
    home: 'home', shop: 'shop', product: 'product', cart: 'cart', checkout: 'checkout',
    confirmation: 'confirmation', login: 'account', account: 'account', order: 'order',
    'track-order': 'order', guide: 'content', tasting: 'content', gifting: 'content',
    privacy: 'content', cookies: 'content', admin: 'admin'
  };
  var user = { loggedIn: false, id: null, tier: null, name: null };
  var sessionId = lsGet('kl_session');
  if (sessionId) {
    var users = readJSON('kl_db_users', []), i;
    for (i = 0; i < users.length; i++) {
      if (users[i].id === sessionId) { user = { loggedIn: true, id: users[i].id, tier: users[i].tier, name: users[i].name }; break; }
    }
  }
  KL.siteVersion = cfg.siteVersion || '1.0.0';
  KL.pageType = TYPES[page] || 'content';
  KL.page = page;
  KL.user = user;
  KL.abVariant = ab;
  KL.visitorType = visitor;

  /* ---------- Consent Mode defaults (only when the mock banner is on) ---------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (settings.consent) {
    window.gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      analytics_storage: 'denied', functionality_storage: 'denied', personalization_storage: 'denied',
      security_storage: 'granted', wait_for_update: 500
    });
    var saved = readJSON('kl_consent', null);   // a returning visitor's earlier choice
    if (saved) { window.gtag('consent', 'update', saved); }
  }

  /* ---------- Data layer initialisation ---------- */
  if (settings.dataLayer) {
    window.dataLayer.push({
      page_type: KL.pageType,
      site_version: KL.siteVersion,
      user_logged_in: user.loggedIn,
      user_id: user.loggedIn ? user.id : undefined,
      customer_tier: user.loggedIn ? user.tier : undefined
    });
  }
})();
