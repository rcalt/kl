/* Brewing guide: YouTube embed, helpful yes/no, dismissible popup after 30 seconds (timer demo). */
(function () {
  'use strict';
  var KL = window.KL, $ = KL.$;

  // YouTube embed with enablejsapi=1 (video ID comes from js/config.js)
  var id = (window.KL_CONFIG || {}).youtubeId;
  $('#guide-video').innerHTML = '<iframe id="guide-video-iframe" src="https://www.youtube.com/embed/' + encodeURIComponent(id) +
    '?enablejsapi=1&rel=0" title="How to brew the perfect cup" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe>';

  // Was this helpful?
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-helpful]'); if (!b) { return; }
    var yes = b.getAttribute('data-helpful') === 'yes';
    KL.dl.guideFeedback(yes ? 'yes' : 'no');
    $('#helpful-buttons').hidden = true;
    $('#helpful-thanks').hidden = false;
  });

  // Popup after 30 seconds
  setTimeout(function () {
    if (sessionStorage.getItem('kl_guide_popup') === 'dismissed') { return; }
    var pop = document.createElement('div');
    pop.className = 'popup'; pop.id = 'guide-popup'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Free brewing chart');
    pop.innerHTML = '<button type="button" class="popup__close" id="guide-popup-close" data-track="guide-popup-close" aria-label="Close">&times;</button>' +
      '<h3>Take the chart with you</h3><p>Our one-page brewing chart: temperature, time and amount for every tea.</p>' +
      '<a class="btn btn--primary" id="guide-popup-download" href="downloads/brewing-chart.pdf" download data-track="guide-popup-download">Download the PDF</a>';
    document.body.appendChild(pop);
    pop.querySelector('#guide-popup-close').addEventListener('click', function () {
      pop.remove(); try { sessionStorage.setItem('kl_guide_popup', 'dismissed'); } catch (e) { /* ignore */ }
    });
  }, 30000);
})();
