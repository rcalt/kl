/* Home page: hero variant, featured products, latest reviews. */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, $ = KL.$;

  // A/B test (cookie kl_ab_variant): variant B changes the hero headline.
  var h = $('#hero-title');
  if (h && KL.abVariant === 'B') { h.textContent = 'Better tea, straight from the estate'; }
  document.documentElement.setAttribute('data-ab', KL.abVariant);

  // Featured products
  var LIST = 'Featured Products', products = KL.catalog.products();
  $('#featured-products').innerHTML = products.map(function (p, i) { return KL.ui.productCard(p, LIST, i + 1); }).join('');
  KL.dl.viewItemList(products, LIST);

  // Latest reviews: 3 most recent from the reviews table
  var latest = KL.db.all('reviews').sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }).slice(0, 3);
  $('#latest-reviews').innerHTML = latest.map(function (r) {
    var p = KL.catalog.byId(r.product_id);
    return '<article class="card review-card" data-rating="' + r.rating + '">' + KL.ui.stars(r.rating) +
      '<p class="review-card__title">' + U.esc(r.title) + '</p><p>' + U.esc(r.body) + '</p>' +
      '<p class="review-card__meta">' + U.esc(r.user_name) + ' on <a href="product.html?slug=' + p.slug + '#reviews" data-track="home-review-' + r.id + '">' + U.esc(p.name) + '</a></p></article>';
  }).join('');
})();
