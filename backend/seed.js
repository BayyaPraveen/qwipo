const db = require('./db');

function runSeed() {
  db.serialize(() => {
    console.log('Clearing tables...');
    db.run('PRAGMA foreign_keys = ON');
    db.run('DELETE FROM addresses');
    db.run('DELETE FROM orders');
    db.run('DELETE FROM customers');
    db.run('DELETE FROM logs');

    const insertCustomer = db.prepare(`INSERT INTO customers
      (first_name,last_name,phone,email,city,state,pincode,only_one_address)
      VALUES (?,?,?,?,?,?,?,?)`);
    const insertAddress = db.prepare(`INSERT INTO addresses
      (customer_id,line1,line2,city,state,pincode,country,is_primary)
      VALUES (?,?,?,?,?,?,?,?)`);

    insertCustomer.run('Amit', 'Kumar', '9876543210', 'amit@example.com', 'Delhi', 'Delhi', '110001', 1, function () {
      const id1 = this.lastID;
      insertAddress.run(id1, 'Street 1', 'Near Park', 'Delhi', 'Delhi', '110001', 'India', 1);
    });

    insertCustomer.run('Sneha', 'Sharma', '9123456789', 'sneha@example.com', 'Mumbai', 'Maharashtra', '400001', 0, function () {
      const id2 = this.lastID;
      insertAddress.run(id2, 'Apartment 12', 'Block B', 'Mumbai', 'Maharashtra', '400001', 'India', 1);
      insertAddress.run(id2, 'Office Address', 'Floor 3', 'Mumbai', 'Maharashtra', '400002', 'India', 0);
    });

    insertCustomer.run('Praveen', 'Yadav', '9000000011', 'praveen11@example.com', 'Noida', 'Uttar Pradesh', '201301', 0, function () {
      const id3 = this.lastID;
      insertAddress.run(id3, 'Sector 62', 'Near Mall', 'Noida', 'Uttar Pradesh', '201301', 'India', 1);
      insertAddress.run(id3, 'Office Park', 'Tower B', 'Noida', 'Uttar Pradesh', '201302', 'India', 0);
      insertAddress.run(id3, 'Home Street', '', 'Greater Noida', 'Uttar Pradesh', '201310', 'India', 0);
    });

    insertCustomer.run('Test', 'NoAddr', '9000000022', 'testnoaddr@example.com', 'Pune', 'Maharashtra', '411001', 1, function () {});

    insertCustomer.finalize();
    insertAddress.finalize();

    db.run(`INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)`, [1, 1200.5, 'completed'], function (err) {
      if (err) console.error('insert order err', err);
      else console.log('Inserted sample order for customer id 1 (to test delete constraint)');
    });

    console.log('Seed statements queued. Waiting for completion...');
    setTimeout(() => {
      db.get('SELECT COUNT(1) as cnt FROM customers', (err, row) => {
        if (err) console.error('count customers err', err);
        else console.log('Customers in DB:', row.cnt);
        db.get('SELECT COUNT(1) as cnt FROM addresses', (err2, row2) => {
          if (err2) console.error('count addresses err', err2);
          else console.log('Addresses in DB:', row2.cnt);
          console.log('Seed complete.');
          process.exit(0);
        });
      });
    }, 700);
  });
}
runSeed();
