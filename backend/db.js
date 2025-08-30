const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = path.resolve(__dirname, 'data', 'db.sqlite');
const dbDir = path.dirname(dbFile);

try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (e) {
  console.error('Failed to create db dir', e);
  process.exit(1);
}

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
    process.exit(1);
  }
  console.log('SQLite DB opened at:', dbFile);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      city TEXT,
      state TEXT,
      pincode TEXT,
      only_one_address INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      country TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total REAL DEFAULT 0,
      status TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT,
      error TEXT,
      stack TEXT,
      context TEXT
    )
  `);
});

module.exports = db;
