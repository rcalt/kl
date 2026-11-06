/*
 * seed-orders.js: demo orders (all fake data).
 *
 * Shape: { id, user_id, email, items[{item_id,item_name,item_variant,price,quantity}], subtotal, discount, coupon,
 *          shipping, total, currency, shipping_address{...}, phone, payment_method, payment_status, status,
 *          status_history[{status,at}], event_id, created_at }
 * Status flow: pending_payment > placed > packed > shipped > out_for_delivery > delivered
 * Side states: payment_failed, cancelled, refunded, partially_refunded
 */
window.KL_DATA = window.KL_DATA || {};
KL_DATA.orders = [
  {
    id: 'KL-20261012-1187', user_id: 'u_1001', email: 'priya@example.com',
    items: [{ item_id: 'KL-DJ-100', item_name: 'Darjeeling First Flush', item_variant: '100g', price: 16.00, quantity: 2 }],
    subtotal: 32.00, discount: 0, coupon: null, shipping: 5.99, shipping_method: 'standard', total: 37.99, currency: 'USD',
    shipping_address: { name: 'Priya Sharma', line1: '14 Lotus Lane', city: 'Austin', region: 'TX', postal_code: '78701', country: 'US' },
    phone: '+15125550141', payment_method: 'kettlepay', payment_status: 'paid', status: 'delivered',
    status_history: [
      { status: 'pending_payment', at: '2026-10-12T09:00:00Z' },
      { status: 'placed',    at: '2026-10-12T09:02:00Z' },
      { status: 'packed',    at: '2026-10-12T15:00:00Z' },
      { status: 'shipped',   at: '2026-10-13T08:00:00Z' },
      { status: 'out_for_delivery', at: '2026-10-16T07:30:00Z' },
      { status: 'delivered', at: '2026-10-16T14:10:00Z' }
    ],
    event_id: 'b3d1c0a2-6f1e-4c7a-9a55-0a1b2c3d4e01', created_at: '2026-10-12T09:00:00Z', webhooks_emitted: true
  },
  {
    id: 'KL-20261030-3562', user_id: 'u_1001', email: 'priya@example.com',
    items: [
      { item_id: 'KL-AS-B25', item_name: 'Assam Breakfast', item_variant: '25 tea bags', price: 6.00, quantity: 2 },
      { item_id: 'KL-NG-050', item_name: 'Nilgiri Green',   item_variant: '50g',         price: 8.00, quantity: 1 }
    ],
    subtotal: 20.00, discount: 0, coupon: null, shipping: 5.99, shipping_method: 'standard', total: 25.99, currency: 'USD',
    shipping_address: { name: 'Priya Sharma', line1: '14 Lotus Lane', city: 'Austin', region: 'TX', postal_code: '78701', country: 'US' },
    phone: '+15125550141', payment_method: 'kettlepay', payment_status: 'paid', status: 'shipped',
    status_history: [
      { status: 'pending_payment', at: '2026-10-30T11:00:00Z' },
      { status: 'placed',  at: '2026-10-30T11:03:00Z' },
      { status: 'packed',  at: '2026-10-31T09:00:00Z' },
      { status: 'shipped', at: '2026-11-01T08:15:00Z' }
    ],
    event_id: 'b3d1c0a2-6f1e-4c7a-9a55-0a1b2c3d4e02', created_at: '2026-10-30T11:00:00Z', webhooks_emitted: true
  },
  {
    id: 'KL-20261020-2204', user_id: 'u_1002', email: 'arjun@example.com',
    items: [
      { item_id: 'KL-NG-100', item_name: 'Nilgiri Green',   item_variant: '100g',        price: 14.00, quantity: 1 },
      { item_id: 'KL-AS-100', item_name: 'Assam Breakfast', item_variant: 'Loose 100g',  price: 7.00,  quantity: 1 }
    ],
    subtotal: 21.00, discount: 0, coupon: null, shipping: 5.99, shipping_method: 'standard', total: 26.99, currency: 'USD',
    shipping_address: { name: 'Arjun Mehta', line1: '88 Maple Court', city: 'Denver', region: 'CO', postal_code: '80203', country: 'US' },
    phone: '+13035550177', payment_method: 'cod', payment_status: 'cod', status: 'delivered',
    status_history: [
      { status: 'placed',  at: '2026-10-20T16:30:00Z' },
      { status: 'packed',  at: '2026-10-21T10:00:00Z' },
      { status: 'shipped', at: '2026-10-22T08:00:00Z' },
      { status: 'out_for_delivery', at: '2026-10-25T07:00:00Z' },
      { status: 'delivered', at: '2026-10-25T13:45:00Z' }
    ],
    event_id: 'b3d1c0a2-6f1e-4c7a-9a55-0a1b2c3d4e03', created_at: '2026-10-20T16:30:00Z', webhooks_emitted: true
  },
  {
    id: 'KL-20261005-0931', user_id: 'u_1003', email: 'meera@example.com',
    items: [{ item_id: 'KL-AS-250', item_name: 'Assam Breakfast', item_variant: 'Loose 250g', price: 15.00, quantity: 4 }],
    subtotal: 60.00, discount: 0, coupon: null, shipping: 0, shipping_method: 'standard', total: 60.00, currency: 'USD',
    shipping_address: { name: 'Meera Iyer', line1: '201 Harbor Street', city: 'Seattle', region: 'WA', postal_code: '98101', country: 'US' },
    phone: '+12065550123', payment_method: 'kettlepay', payment_status: 'paid', status: 'partially_refunded',
    status_history: [
      { status: 'pending_payment', at: '2026-10-05T12:00:00Z' },
      { status: 'placed',  at: '2026-10-05T12:02:00Z' },
      { status: 'packed',  at: '2026-10-06T09:00:00Z' },
      { status: 'shipped', at: '2026-10-06T16:00:00Z' },
      { status: 'out_for_delivery', at: '2026-10-09T08:00:00Z' },
      { status: 'delivered', at: '2026-10-09T12:20:00Z' },
      { status: 'partially_refunded', at: '2026-10-12T10:00:00Z' }
    ],
    event_id: 'b3d1c0a2-6f1e-4c7a-9a55-0a1b2c3d4e04', created_at: '2026-10-05T12:00:00Z', webhooks_emitted: true
  }
];
