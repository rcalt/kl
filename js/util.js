/* util.js: small helpers shared everywhere (KL.util, KL.$, KL.$$). */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  var util = KL.util = {};

  /** uuid v4. crypto.randomUUID needs a secure context (localhost or https); fall back otherwise. */
  util.uuid = function () {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') { return window.crypto.randomUUID(); }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  util.round2 = function (n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; };
  util.money = function (n) { return '$' + Number(n || 0).toFixed(2); };

  util.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  util.fmtDate = function (iso) {
    if (!iso) { return ''; }
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  util.fmtDateTime = function (iso) {
    if (!iso) { return ''; }
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  util.param = function (name) { return new URLSearchParams(window.location.search).get(name); };

  util.statusLabel = function (s) {
    var map = {
      pending_payment: 'Payment pending', placed: 'Order placed', packed: 'Packed', shipped: 'Shipped',
      out_for_delivery: 'Out for delivery', delivered: 'Delivered', payment_failed: 'Payment failed',
      cancelled: 'Cancelled', refunded: 'Refunded', partially_refunded: 'Partially refunded',
      requested: 'Requested', approved: 'Approved', rejected: 'Rejected'
    };
    return map[s] || s;
  };

  util.copy = function (text) {
    if (navigator.clipboard && window.isSecureContext) { return navigator.clipboard.writeText(text); }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  };

  /** Only allow same-site relative redirects like "product.html?slug=x#reviews". */
  util.safeNext = function (next) {
    if (!next) { return null; }
    if (/^[a-z][a-z0-9+.-]*:/i.test(next) || next.indexOf('//') === 0 || next.charAt(0) === '/') { return null; }
    return next;
  };

  KL.$ = function (sel, root) { return (root || document).querySelector(sel); };
  KL.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
})();
