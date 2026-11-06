/* Shop page: product grid with client-side category filter and sort (URL does not change). */
(function () {
  'use strict';
  var KL = window.KL, $ = KL.$, $$ = KL.$$;
  var LIST = 'Shop All', category = 'All', sort = 'featured';

  function visible() {
    var rows = KL.catalog.products().filter(function (p) { return category === 'All' || p.category === category; });
    var rating = function (p) { return KL.reviews.list(p.id).average; };
    if (sort === 'price-asc') { rows.sort(function (a, b) { return KL.catalog.fromPrice(a) - KL.catalog.fromPrice(b); }); }
    if (sort === 'price-desc') { rows.sort(function (a, b) { return KL.catalog.fromPrice(b) - KL.catalog.fromPrice(a); }); }
    if (sort === 'rating') { rows.sort(function (a, b) { return rating(b) - rating(a); }); }
    if (sort === 'name') { rows.sort(function (a, b) { return a.name.localeCompare(b.name); }); }
    return rows;
  }
  function render() {
    var rows = visible();
    $('#shop-grid').innerHTML = rows.map(function (p, i) { return KL.ui.productCard(p, LIST, i + 1); }).join('');
    $('#shop-count').textContent = rows.length + (rows.length === 1 ? ' tea' : ' teas');
    KL.dl.viewItemList(rows, LIST);
  }

  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      category = chip.getAttribute('data-category');
      $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      render();
    });
  });
  $('#shop-sort').addEventListener('change', function (e) { sort = e.target.value; render(); });
  render();
})();
