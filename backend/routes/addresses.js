const express = require('express');
const router = express.Router();
const db = require('../db');
const { createAddressValidators, handleValidation } = require('../middleware/validators');

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

router.get('/customer/:customerId', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const addresses = await dbAll('SELECT * FROM addresses WHERE customer_id = ?', [customerId]);
    res.json({ success: true, data: addresses });
  } catch (err) { next(err); }
});

router.post('/customer/:customerId', createAddressValidators, handleValidation, async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const { line1, line2, city, state, pincode, country, is_primary } = req.body;
    const cust = await dbGet('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!cust) return res.status(404).json({ success: false, message: 'Customer not found' });
    const info = await dbRun(
      `INSERT INTO addresses
      (customer_id,line1,line2,city,state,pincode,country,is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, line1, line2 || null, city || null, state || null, pincode || null, country || null, is_primary ? 1 : 0]
    );
    const cntRow = await dbGet('SELECT COUNT(1) as cnt FROM addresses WHERE customer_id = ?', [customerId]);
    await dbRun('UPDATE customers SET only_one_address = ? WHERE id = ?', [cntRow.cnt === 1 ? 1 : 0, customerId]);
    res.status(201).json({ success: true, message: 'Address added', id: info.lastID });
  } catch (err) { next(err); }
});

router.put('/:id', createAddressValidators, handleValidation, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbGet('SELECT * FROM addresses WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Address not found' });
    const { line1, line2, city, state, pincode, country, is_primary } = req.body;
    await dbRun(
      `
      UPDATE addresses SET
        line1 = COALESCE(?, line1),
        line2 = COALESCE(?, line2),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),
        country = COALESCE(?, country),
        is_primary = COALESCE(?, is_primary)
      WHERE id = ?
    `,
      [line1, line2, city, state, pincode, country, typeof is_primary === 'undefined' ? existing.is_primary : (is_primary ? 1 : 0), id]
    );
    if (typeof is_primary !== 'undefined' && is_primary) {
      await dbRun('UPDATE addresses SET is_primary = 0 WHERE customer_id = ? AND id != ?', [existing.customer_id, id]);
    }
    res.json({ success: true, message: 'Address updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const address = await dbGet('SELECT * FROM addresses WHERE id = ?', [id]);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    const customerId = address.customer_id;
    await dbRun('DELETE FROM addresses WHERE id = ?', [id]);
    const cntRow = await dbGet('SELECT COUNT(1) as cnt FROM addresses WHERE customer_id = ?', [customerId]);
    await dbRun('UPDATE customers SET only_one_address = ? WHERE id = ?', [cntRow.cnt === 1 ? 1 : 0, customerId]);
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
