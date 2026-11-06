/*
 * seed-reviews.js: demo product reviews.
 * Shape: { id, product_id (SKU base), user_id, user_name, rating 1-5, title, body, verified_buyer, created_at }
 */
window.KL_DATA = window.KL_DATA || {};
KL_DATA.reviews = [
  { id: 'RV-1001', product_id: 'KL-DJ', user_id: 'u_1001', user_name: 'Priya S.', rating: 5, title: 'Spring in a cup', body: 'Delicate and floral, exactly what a first flush should be. I order it every season.', verified_buyer: true, created_at: '2026-10-20T08:00:00Z' },
  { id: 'RV-1002', product_id: 'KL-DJ', user_id: null, user_name: 'Daniel R.', rating: 4, title: 'Lovely, but fussy', body: 'Wonderful flavour. Do not use boiling water or it turns bitter fast.', verified_buyer: true, created_at: '2026-09-28T17:30:00Z' },
  { id: 'RV-1003', product_id: 'KL-DJ', user_id: null, user_name: 'Hannah L.', rating: 5, title: 'Best Darjeeling I have had', body: 'Muscatel notes are obvious. Great gift for my dad.', verified_buyer: false, created_at: '2026-08-14T10:10:00Z' },
  { id: 'RV-1004', product_id: 'KL-AS', user_id: 'u_1003', user_name: 'Meera I.', rating: 5, title: 'Our cafe staple', body: 'Strong, malty and consistent. The 250g bags are the best value for us.', verified_buyer: true, created_at: '2026-10-14T11:00:00Z' },
  { id: 'RV-1005', product_id: 'KL-AS', user_id: 'u_1002', user_name: 'Arjun M.', rating: 4, title: 'Great with milk', body: 'Brews dark and bold. The tea bags are handy at the office.', verified_buyer: true, created_at: '2026-10-28T09:20:00Z' },
  { id: 'RV-1006', product_id: 'KL-AS', user_id: null, user_name: 'Tom W.', rating: 3, title: 'Good, a bit strong for me', body: 'Nice flavour but I steeped too long. Shorter brew next time.', verified_buyer: false, created_at: '2026-07-03T07:45:00Z' },
  { id: 'RV-1007', product_id: 'KL-NG', user_id: 'u_1002', user_name: 'Arjun M.', rating: 5, title: 'Clean and smooth', body: 'No bitterness at all. I cold-brewed it overnight and it was brilliant.', verified_buyer: true, created_at: '2026-10-29T19:00:00Z' },
  { id: 'RV-1008', product_id: 'KL-NG', user_id: null, user_name: 'Sofia K.', rating: 4, title: 'Gentle everyday green', body: 'Soft and a little sweet. Second steep is just as good.', verified_buyer: false, created_at: '2026-10-02T13:15:00Z' },
  { id: 'RV-1009', product_id: 'KL-MC', user_id: null, user_name: 'Rohan P.', rating: 5, title: 'Tastes like home', body: 'Proper chai spice balance. The cardamom is front and centre.', verified_buyer: true, created_at: '2026-09-18T06:50:00Z' },
  { id: 'RV-1010', product_id: 'KL-MC', user_id: null, user_name: 'Laura B.', rating: 4, title: 'Cosy in winter', body: 'Lovely simmered with oat milk. Wish the large bag were back in stock.', verified_buyer: false, created_at: '2026-10-26T20:05:00Z' }
];
