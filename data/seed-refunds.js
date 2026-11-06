/*
 * seed-refunds.js: demo refunds.
 * Shape: { id, order_id, user_id, items[{item_id,quantity,price}], amount, reason, note, status, requested_at, decided_at, event_id }
 * Status: requested > approved | rejected
 * Reasons: damaged | wrong_item | not_as_described | changed_mind | other
 */
window.KL_DATA = window.KL_DATA || {};
KL_DATA.refunds = [
  {
    id: 'RF-1001', order_id: 'KL-20261005-0931', user_id: 'u_1003',
    items: [{ item_id: 'KL-AS-250', quantity: 1, price: 15.00 }],
    amount: 15.00, reason: 'damaged', note: 'One bag arrived split open.',
    status: 'approved', requested_at: '2026-10-10T09:00:00Z', decided_at: '2026-10-12T10:00:00Z',
    event_id: 'c4e2d1b3-7a2f-4d8b-8b66-1b2c3d4e5f01'
  }
];
