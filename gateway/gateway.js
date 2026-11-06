/*
 * KettlePay gateway (separate origin).
 * Query string in: order, amount, currency, return (the store's confirmation URL), gtm (student's container ID).
 * Query string out: <return>?order=...&status=paid|declined, keeping any _gl linker parameter (cross-domain demo).
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var order = params.get('order') || '', amount = params.get('amount') || '', currency = params.get('currency') || 'USD';
  var ret = params.get('return') || '', gtm = (params.get('gtm') || '').trim();
  var gl = params.get('_gl');

  function $(id) { return document.getElementById(id); }

  /* Load GTM from ?gtm= so the same container can run on both domains. */
  if (/^GTM-[A-Z0-9]{4,}$/i.test(gtm)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ page_type: 'gateway', order_id: order });
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', gtm.toUpperCase());
  }

  /* Only redirect to http(s) URLs. */
  var validReturn = /^https?:\/\//i.test(ret);
  if (!order || !validReturn) {
    $('gateway-content').hidden = true;
    var e = $('gateway-error'); e.hidden = false; e.className = 'gw-error';
    e.textContent = 'This payment link is missing an order or a valid return address (it must start with http:// or https://). Go back to the shop and try again.';
    return;
  }
  $('gw-order').textContent = order;
  $('gw-amount').textContent = (currency === 'USD' ? '$' : currency + ' ') + Number(amount || 0).toFixed(2);

  function finish(status) {
    var url = new URL(ret);
    url.searchParams.set('order', order);
    url.searchParams.set('status', status);
    if (gl) { url.searchParams.set('_gl', gl); }
    location.href = url.href;
  }
  $('gateway-success').addEventListener('click', function () { finish('paid'); });
  $('gateway-decline').addEventListener('click', function () { finish('declined'); });
})();
