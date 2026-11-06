/*
 * db.js: the localStorage "database".
 * Seed files (data/seed-*.js) are copied into localStorage on first visit; every change is saved there.
 * Tables live under keys kl_db_<table>. Every write fires a "kl:db" event on document, and the browser's
 * "storage" event does the same for other open tabs (so an admin tab can move an order along live).
 */
(function () {
  'use strict';
  var KL = window.KL = window.KL || {};
  var TABLES = ['users', 'orders', 'refunds', 'reviews', 'webhooks'];
  var db = KL.db = { tables: TABLES };

  function key(t) { return 'kl_db_' + t; }
  function read(t) {
    try { var raw = localStorage.getItem(key(t)); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function write(t, rows) {
    try { localStorage.setItem(key(t), JSON.stringify(rows)); } catch (e) { /* storage full or blocked */ }
    emit(t);
  }
  function emit(t) { document.dispatchEvent(new CustomEvent('kl:db', { detail: { table: t } })); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  db.all = function (t) { return read(t); };
  db.get = function (t, id) {
    var rows = read(t);
    for (var i = 0; i < rows.length; i++) { if (rows[i].id === id) { return rows[i]; } }
    return null;
  };
  db.insert = function (t, row) { var rows = read(t); rows.push(row); write(t, rows); return row; };
  db.update = function (t, id, patch) {
    var rows = read(t), hit = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { for (var k in patch) { rows[i][k] = patch[k]; } hit = rows[i]; break; }
    }
    if (!hit) { throw new Error('Record ' + id + ' not found in ' + t); }
    write(t, rows);
    return hit;
  };
  db.remove = function (t, id) {
    write(t, read(t).filter(function (r) { return r.id !== id; }));
  };

  /** Copy seed data into localStorage (first visit, or when KL_DATA.seedVersion changed). */
  db.seed = function (force) {
    var data = window.KL_DATA || {};
    var current = localStorage.getItem('kl_db_seed_version');
    var wanted = String(data.seedVersion || 1);
    var missing = TABLES.some(function (t) { return localStorage.getItem(key(t)) === null; });
    if (!force && !missing && current === wanted) { return false; }
    var seeds = { users: data.users, orders: data.orders, refunds: data.refunds, reviews: data.reviews, webhooks: [] };
    TABLES.forEach(function (t) { write(t, clone(seeds[t] || [])); });
    localStorage.setItem('kl_db_seed_version', wanted);
    return true;
  };

  /** Wipe all demo data (tables, cart, session) and re-seed. Keeps the GTM ID and demo settings. */
  db.reset = function () {
    TABLES.forEach(function (t) { localStorage.removeItem(key(t)); });
    ['kl_db_seed_version', 'kl_cart', 'kl_session', 'kl_purchased', 'kl_consent'].forEach(function (k) { localStorage.removeItem(k); });
    try { sessionStorage.removeItem('kl_checkout'); sessionStorage.removeItem('kl_dl_log'); } catch (e) { /* ignore */ }
    db.seed(true);
  };

  // Other tabs changed something: tell this tab's code through the same custom events.
  window.addEventListener('storage', function (e) {
    if (!e.key) { return; }
    if (e.key.indexOf('kl_db_') === 0) { emit(e.key.slice(6)); }
    if (e.key === 'kl_cart') { document.dispatchEvent(new CustomEvent('kl:cart')); }
  });

  try { db.seed(false); } catch (e) { console.warn('Kettle & Leaf: could not seed demo data', e); }
})();
