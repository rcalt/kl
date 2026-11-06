/* Corporate gifting lead form: JS submit with preventDefault, inline success, pushes generate_lead. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;
  var form = $('#gifting-form');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var company = $('#gift-company').value.trim(), name = $('#gift-name').value.trim(), email = $('#gift-email').value.trim(), size = $('#gift-size').value;
    var err = $('#gifting-error');
    if (!company || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !size) {
      err.innerHTML = '<div class="form-error" role="alert">Please fill in company, name, a valid work email and team size.</div>';
      return;
    }
    err.innerHTML = '';
    KL.dl.generateLead({ currency: 'USD', value: 100, lead_type: 'corporate_gifting', team_size: size });
    form.hidden = true;
    $('#gifting-success').hidden = false;
    $('#gifting-success-name').textContent = name;
  });
})();
