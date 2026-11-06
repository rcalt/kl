/*
 * seed-users.js: demo customers. Passwords are PLAIN TEXT on purpose so students can read everything.
 * No real authentication exists. NEVER use a real password on this site.
 *
 * Shape: { id, name, email, password, tier, created_at }
 * Tiers: new | subscriber | wholesale
 */
window.KL_DATA = window.KL_DATA || {};
KL_DATA.users = [
  { id: 'u_1001', name: 'Priya Sharma', email: 'priya@example.com', password: 'tea123', tier: 'subscriber', created_at: '2026-01-14T10:20:00Z' },
  { id: 'u_1002', name: 'Arjun Mehta',  email: 'arjun@example.com', password: 'tea123', tier: 'new',        created_at: '2026-10-18T14:05:00Z' },
  { id: 'u_1003', name: 'Meera Iyer',   email: 'meera@example.com', password: 'tea123', tier: 'wholesale',  created_at: '2026-03-02T09:40:00Z' }
];
