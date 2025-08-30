const express = require('express');
const router = express.Router();
const db = require('../db');
const {
  createCustomerValidators,
  updateCustomerValidators,
  handleValidation
} = require('../middleware/validators');

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
}
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
}
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  }));
}

router.post('/', createCustomerValidators, handleValidation, async (req, res, next) => {
  try {
    const { first_name, last_name, phone, email, city, state, pincode } = req.body;
    const dupPhone = await dbGet('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (dupPhone) return res.status(400).json({ success: false, message: 'Phone already exists' });
    if (email) {
      const dupEmail = await dbGet('SELECT id FROM customers WHERE email = ?', [email]);
      if (dupEmail) return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const result = await dbRun(
      `INSERT INTO customers
      (first_name,last_name,phone,email,city,state,pincode,only_one_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [first_name, last_name, phone, email || null, city || null, state || null, pincode || null]
    );
    res.status(201).json({ success: true, message: 'Customer created', id: result.lastID });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    let { page = 1, limit = 10, sort = 'created_at', order = 'DESC', city, state, pincode, search } = req.query;
    page = Number(page); limit = Number(limit); const offset = (page - 1) * limit;
    const where = []; const params = [];
    if (city) { where.push('c.city = ?'); params.push(city); }
    if (state) { where.push('c.state = ?'); params.push(state); }
    if (pincode) { where.push('c.pincode = ?'); params.push(pincode); }
    if (search) {
      where.push('(c.first_name || " " || c.last_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT c.*,
        (SELECT COUNT(1) FROM addresses a WHERE a.customer_id = c.id) as addresses_count
      FROM customers c
      ${whereSQL}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;
    const rows = await dbAll(sql, [...params, limit, offset]);
    const countSql = `SELECT COUNT(1) as total FROM customers c ${whereSQL}`;
    const countRow = await dbGet(countSql, params);
    const total = countRow ? countRow.total : 0;
    res.json({ success: true, data: rows, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const addresses = await dbAll('SELECT * FROM addresses WHERE customer_id = ?', [id]);
    const orders = await dbAll('SELECT * FROM orders WHERE customer_id = ?', [id]);
    const payments = []; // optional
    res.json({ success: true, customer, addresses, orders, payments });
  } catch (err) { next(err); }
});

router.put('/:id', updateCustomerValidators, handleValidation, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbGet('SELECT * FROM customers WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Customer not found' });
    const { first_name, last_name, phone, email, city, state, pincode } = req.body;
    if (phone && phone !== existing.phone) {
      const dup = await dbGet('SELECT id FROM customers WHERE phone = ?', [phone]);
      if (dup) return res.status(400).json({ success: false, message: 'Phone already in use' });
    }
    if (email && email !== existing.email) {
      const dupE = await dbGet('SELECT id FROM customers WHERE email = ?', [email]);
      if (dupE) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    await dbRun(
      `UPDATE customers SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      pincode = COALESCE(?, pincode)
      WHERE id = ?`,
      [first_name, last_name, phone, email, city, state, pincode, id]
    );
    res.json({ success: true, message: 'Customer updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const orders = await dbGet('SELECT COUNT(1) as cnt FROM orders WHERE customer_id = ?', [id]);
    if (orders && orders.cnt > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete: linked transactions exist' });
    }
    await dbRun('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { next(err); }
});

router.get('/multiple-addresses/list', async (req, res, next) => {
  try {
    const rows = await dbAll(`
      SELECT c.id, c.first_name, c.last_name, COUNT(a.id) as addr_count
      FROM customers c
      JOIN addresses a ON a.customer_id = c.id
      GROUP BY c.id
      HAVING addr_count > 1
    `, []);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
