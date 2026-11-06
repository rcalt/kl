/*
 * Product page: ONE page serves all four products. Reads ?slug=, finds the product in data/products.js and renders
 * everything into the containers in product.html. Page source shows empty containers; DevTools shows the full product.
 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.util, C = KL.catalog, $ = KL.$, $$ = KL.$$;
  var root = $('#product-root');
  var product = C.bySlug(U.param('slug') || '');

  if (!product) {
    document.title = 'Product not found | Kettle & Leaf';
    root.innerHTML = '<div class="container empty-state"><h1>Product not found</h1><p>We could not find that tea.</p><a class="btn btn--primary" id="pdp-back-to-shop" href="shop.html" data-track="pdp-back-to-shop">Back to the shop</a></div>';
    return;
  }
  document.title = product.name + ' | Kettle & Leaf';
  var meta = $('meta[name="description"]'); if (meta) { meta.setAttribute('content', product.short); }

  var selected = C.defaultVariant(product), qty = 1, hasRendered = false;

  function variantsHtml() {
    return product.variants.map(function (v) {
      var cls = 'variant-picker__option' + (v.id === selected.id ? ' variant-picker__option--selected' : '') + (v.inStock ? '' : ' variant-picker__option--oos');
      return '<label class="' + cls + '"><input type="radio" name="variant" value="' + v.id + '" data-variant-id="' + v.id + '" data-price="' + v.price.toFixed(2) + '"' + (v.id === selected.id ? ' checked' : '') + '>' +
        '<span class="variant-picker__label">' + U.esc(v.label) + '</span></label>';
    }).join('');
  }
  function renderShell() {
    var r = KL.reviews.list(product.id);
    root.innerHTML =
      '<div class="container"><div class="pdp" data-product-id="' + product.id + '" data-product-name="' + U.esc(product.name) + '">' +
      '<div class="gallery"><div class="gallery__main"><img id="pdp-main-image" src="' + product.images[0] + '" alt="' + U.esc(product.name) + ' tea tin" width="640" height="640"></div>' +
      '<div class="gallery__thumbs">' + product.images.map(function (src, i) {
        return '<button type="button" class="gallery__thumb" id="pdp-thumb-' + (i + 1) + '" data-src="' + src + '" data-track="pdp-thumb-' + (i + 1) + '" aria-current="' + (i === 0) + '" aria-label="Show image ' + (i + 1) + '"><img src="' + src + '" alt="" width="76" height="76"></button>';
      }).join('') + '</div></div>' +
      '<div class="pdp__info">' + (product.badge ? '<span class="badge badge--gold" id="pdp-badge">' + U.esc(product.badge) + '</span>' : '') +
      '<h1 id="pdp-title">' + U.esc(product.name) + '</h1>' +
      '<p class="pdp__rating" id="pdp-rating">' + KL.ui.stars(r.average) + ' <a href="#reviews" data-track="pdp-rating-link">' + (r.count ? r.average.toFixed(1) + ' · ' + r.count + ' reviews' : 'No reviews yet') + '</a></p>' +
      '<p>' + U.esc(product.short) + '</p>' +
      '<p class="pdp__price" id="pdp-price" data-price="' + selected.price.toFixed(2) + '">' + U.money(selected.price) + '</p>' +
      '<fieldset class="variant-picker" id="pdp-variants" data-step="variant"><legend>Size</legend><div class="variant-picker__options">' + variantsHtml() + '</div></fieldset>' +
      '<p class="pdp__stock" id="pdp-stock"></p>' +
      '<div class="pdp__buy"><div class="stepper" id="pdp-qty"><button type="button" id="pdp-qty-minus" data-track="pdp-qty-minus" aria-label="Decrease quantity">−</button>' +
      '<input type="text" inputmode="numeric" id="pdp-qty-input" value="1" aria-label="Quantity"><button type="button" id="pdp-qty-plus" data-track="pdp-qty-plus" aria-label="Increase quantity">+</button></div>' +
      '<button type="button" class="btn btn--primary" id="pdp-add-to-cart" data-track="pdp-add-to-cart">Add to cart</button></div>' +
      '<div class="pdp__extras">' +
      '<!-- Teaching case (W2.3): no id, no data attributes, only a generated-looking class. -->' +
      '<button type="button" class="css-7f3k2q" aria-pressed="false">🎁 Add gift wrap</button>' +
      '<!-- Teaching case: the visible text of this link changes with state, so Click Text is a weak condition. -->' +
      '<a href="#delivery-details" id="pdp-delivery-toggle" data-track="pdp-delivery-toggle" class="text-link-toggle">Show delivery details</a></div>' +
      '<p id="delivery-details" class="muted" hidden>Orders ship within 1 business day. Standard delivery takes 3-6 days, Express 1-2 days.</p>' +
      '<p class="muted"><strong>Origin:</strong> ' + U.esc(product.origin) + '</p></div></div>' +
      '<div class="tabs" id="pdp-tabs"><div class="tabs__list" role="tablist">' +
      ['description:Description', 'tasting:Tasting notes', 'brewing:Brewing', 'shipping:Shipping'].map(function (t, i) {
        var k = t.split(':');
        return '<button type="button" role="tab" class="tabs__tab" id="pdp-tab-' + k[0] + '" data-tab="' + k[0] + '" data-track="pdp-tab-' + k[0] + '" aria-selected="' + (i === 0) + '">' + k[1] + '</button>';
      }).join('') + '</div><div class="tabs-panel" id="pdp-tab-panel" role="tabpanel"></div></div></div>' +
      '<section class="reviews" id="reviews"><div class="container" id="reviews-root"></div></section>' +
      '<section class="section section--green"><div class="container"><div class="section__head"><h2>You may also like</h2></div><div class="grid grid--4" id="related-products"></div></div></section>';
  }

  var TAB = {
    description: function () { return '<p>' + U.esc(product.long) + '</p>'; },
    tasting: function () { return '<ul>' + product.notes.map(function (n) { return '<li>' + U.esc(n) + '</li>'; }).join('') + '</ul>'; },
    brewing: function () {
      var b = product.brewing;
      return '<ul><li><strong>Temperature:</strong> ' + U.esc(b.temp) + '</li><li><strong>Time:</strong> ' + U.esc(b.time) + '</li><li><strong>Amount:</strong> ' + U.esc(b.amount) + '</li></ul><p>' + U.esc(b.tip) + '</p>';
    },
    shipping: function () { return '<p>Standard shipping is $5.99, and free on orders of $40 or more. Express is $12.00. Everything ships from our Kolkata packing room within one business day. This is a demo store: nothing will actually ship.</p>'; }
  };
  function showTab(name) {
    $$('.tabs__tab').forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name)); });
    $('#pdp-tab-panel').innerHTML = TAB[name]();
  }

  function updateVariant(fire) {
    $('#pdp-price').textContent = U.money(selected.price);
    $('#pdp-price').setAttribute('data-price', selected.price.toFixed(2));
    $$('.variant-picker__option').forEach(function (l) {
      l.classList.toggle('variant-picker__option--selected', l.querySelector('input').value === selected.id);
    });
    var stock = $('#pdp-stock'), btn = $('#pdp-add-to-cart');
    stock.textContent = selected.inStock ? 'In stock' : 'Out of stock';
    stock.className = 'pdp__stock' + (selected.inStock ? '' : ' pdp__stock--out');
    btn.disabled = !selected.inStock;
    btn.textContent = selected.inStock ? 'Add to cart' : 'Out of stock';
    if (fire) { KL.dl.viewItem(selected.id); }
  }

  /* ---------------- reviews ---------------- */
  var reviewSort = 'newest', formOpen = false, rating = 0;
  function renderReviews() {
    var r = KL.reviews.list(product.id), rows = r.reviews.slice();
    if (reviewSort === 'newest') { rows.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }); }
    if (reviewSort === 'highest') { rows.sort(function (a, b) { return b.rating - a.rating; }); }
    if (reviewSort === 'lowest') { rows.sort(function (a, b) { return a.rating - b.rating; }); }
    var me = KL.auth.current(), next = encodeURIComponent('product.html?slug=' + product.slug + '&review=1#reviews');
    var action;
    if (!me) { action = '<a class="btn btn--ghost" id="review-login-link" href="login.html?next=' + next + '" data-track="review-login-link">Log in to review</a>'; }
    else if (KL.reviews.hasReviewed(product.id)) { action = '<p class="muted">Thanks, you have already reviewed this tea.</p>'; }
    else { action = '<button type="button" class="btn btn--ghost" id="review-write" data-track="review-write">Write a review</button>'; }
    $('#reviews-root').innerHTML =
      '<h2>Reviews</h2><div class="reviews__summary"><div><div class="reviews__avg" id="reviews-average">' + (r.count ? r.average.toFixed(1) : '–') + '</div>' + KL.ui.stars(r.average) + '<p class="muted">' + r.count + ' review' + (r.count === 1 ? '' : 's') + '</p></div><div>' +
      [5, 4, 3, 2, 1].map(function (n) {
        var pct = r.count ? Math.round(r.breakdown[n] / r.count * 100) : 0;
        return '<div class="bar-row"><span>' + n + ' ★</span><span class="bar-row__track"><span class="bar-row__fill" style="width:' + pct + '%"></span></span><span>' + r.breakdown[n] + '</span></div>';
      }).join('') + '</div></div>' +
      '<div class="section__head"><div>' + action + '</div><div><label class="visually-hidden" for="review-sort">Sort reviews</label><select id="review-sort" style="width:auto"><option value="newest">Newest</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option></select></div></div>' +
      '<form class="card" id="review-form" ' + (formOpen ? '' : 'hidden') + ' novalidate style="margin-bottom:1.5rem"><h3>Write a review</h3><div id="review-error"></div>' +
      '<div class="field"><label>Your rating</label><span class="star-picker" id="review-stars" role="radiogroup" aria-label="Rating">' +
      [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-rating="' + n + '" class="' + (n <= rating ? 'is-on' : '') + '" aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '">★</button>'; }).join('') + '</span></div>' +
      '<div class="field"><label for="review-title">Title</label><input type="text" id="review-title" maxlength="80"></div>' +
      '<div class="field"><label for="review-body">Your review</label><textarea id="review-body"></textarea></div>' +
      '<button type="submit" class="btn btn--primary" id="review-submit" data-track="review-submit">Submit review</button></form>' +
      '<div id="review-list">' + (rows.length ? rows.map(function (rv) {
        return '<article class="review-card" data-rating="' + rv.rating + '"><div class="review-card__head">' + KL.ui.stars(rv.rating) +
          (rv.verified_buyer ? '<span class="review-card__badge">Verified buyer</span>' : '') + '</div><p class="review-card__title">' + U.esc(rv.title) + '</p><p>' + U.esc(rv.body) + '</p><p class="review-card__meta">' + U.esc(rv.user_name) + ' · ' + U.fmtDate(rv.created_at) + '</p></article>';
      }).join('') : '<p class="empty-state">No reviews yet. Be the first!</p>') + '</div>';
    $('#review-sort').value = reviewSort;
  }
  function openReviewForm() {
    if (!KL.auth.current() || KL.reviews.hasReviewed(product.id)) { return; }
    formOpen = true; renderReviews(); KL.dl.reviewStarted(product.id);
    var t = $('#review-title'); if (t) { t.focus(); }
  }

  /* ---------------- events ---------------- */
  function bind() {
    root.addEventListener('click', function (e) {
      var t = e.target;
      var thumb = t.closest('.gallery__thumb');
      if (thumb) {
        $('#pdp-main-image').src = thumb.getAttribute('data-src');
        $$('.gallery__thumb').forEach(function (b) { b.setAttribute('aria-current', String(b === thumb)); });
      }
      var tab = t.closest('.tabs__tab'); if (tab) { showTab(tab.getAttribute('data-tab')); }
      if (t.closest('#pdp-qty-minus')) { qty = Math.max(1, qty - 1); $('#pdp-qty-input').value = qty; }
      if (t.closest('#pdp-qty-plus')) { qty = Math.min(KL_DATA.commerce.maxQuantity, qty + 1); $('#pdp-qty-input').value = qty; }
      if (t.closest('#pdp-add-to-cart')) { KL.ui.addToCart(selected.id, qty, { listName: undefined }); }
      var gift = t.closest('.css-7f3k2q');
      if (gift) { var on = gift.getAttribute('aria-pressed') !== 'true'; gift.setAttribute('aria-pressed', String(on)); gift.textContent = on ? '🎁 Gift wrap added' : '🎁 Add gift wrap'; }
      var tog = t.closest('#pdp-delivery-toggle');
      if (tog) { e.preventDefault(); var d = $('#delivery-details'); d.hidden = !d.hidden; tog.textContent = d.hidden ? 'Show delivery details' : 'Hide delivery details'; }
      if (t.closest('#review-write')) { openReviewForm(); }
      var star = t.closest('#review-stars button');
      if (star) { rating = parseInt(star.getAttribute('data-rating'), 10); $$('#review-stars button').forEach(function (b) { b.classList.toggle('is-on', parseInt(b.getAttribute('data-rating'), 10) <= rating); }); }
    });
    root.addEventListener('change', function (e) {
      if (e.target.name === 'variant') {
        selected = product.variants.filter(function (v) { return v.id === e.target.value; })[0];
        updateVariant(true);
      }
      if (e.target.id === 'review-sort') { reviewSort = e.target.value; renderReviews(); }
    });
    root.addEventListener('input', function (e) {
      if (e.target.id === 'pdp-qty-input') {
        var n = parseInt(e.target.value, 10);
        if (!isNaN(n)) { qty = Math.min(KL_DATA.commerce.maxQuantity, Math.max(1, n)); }
      }
    });
    root.addEventListener('submit', function (e) {
      if (e.target.id !== 'review-form') { return; }
      e.preventDefault();
      try {
        var rv = KL.reviews.add(product.id, rating, $('#review-title').value, $('#review-body').value);
        KL.dl.reviewSubmitted(rv);
        formOpen = false; rating = 0; renderReviews(); KL.ui.toast('Thanks for your review!');
      } catch (err) { $('#review-error').innerHTML = '<div class="form-error" role="alert">' + U.esc(err.message) + '</div>'; }
    });
    document.addEventListener('kl:db', function (ev) { if (hasRendered && ev.detail.table === 'reviews' && !formOpen) { renderReviews(); } });
  }

  /* ---------------- start ---------------- */
  renderShell();
  showTab('description');
  updateVariant(false);
  renderReviews();
  var others = C.products().filter(function (p) { return p.id !== product.id; });
  $('#related-products').innerHTML = others.map(function (p, i) { return KL.ui.productCard(p, 'Related Products', i + 1); }).join('');
  bind();
  hasRendered = true;
  KL.dl.viewItemList(others, 'Related Products');
  KL.dl.viewItem(selected.id);
  if (U.param('review') === '1') { openReviewForm(); }
  if (location.hash === '#reviews') { var rs = $('#reviews'); if (rs) { rs.scrollIntoView(); } }
})();
