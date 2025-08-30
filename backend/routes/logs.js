const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { ts, error, stack, context } = req.body || {};
  if (!error) return res.status(400).json({ success: false, message: 'No error provided' });
  db.run('INSERT INTO logs (ts, error, stack, context) VALUES (?, ?, ?, ?)', [ts || new Date().toISOString(), error, stack || null, JSON.stringify(context || {})], function (err) {
    if (err) {
      console.error('Failed to save log', err);
      return res.status(500).json({ success: false, message: 'Log save failed' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

module.exports = router;
