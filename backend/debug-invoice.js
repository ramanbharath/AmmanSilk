const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', port:5432, database:'ammansilks_db', user:'postgres', password:'postgres' });

async function run() {
  // Check customers table constraints
  const c = await pool.query("SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name='customers'");
  console.log('customers constraints:', c.rows);

  // Try a test invoice insert to see exact error
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  // Get admin user id
  const userRes = await pool.query("SELECT id FROM users WHERE username='admin'");
  const userId = userRes.rows[0].id;
  console.log('admin user id:', userId);

  // Try inserting a test customer
  try {
    const custRes = await pool.query(
      "INSERT INTO customers (name, mobile) VALUES ($1,$2) ON CONFLICT (mobile) DO UPDATE SET name=EXCLUDED.name RETURNING id",
      ['Test Customer', '9999999999']
    );
    console.log('customer insert ok:', custRes.rows[0]);
  } catch(e) {
    console.error('customer insert error:', e.message);
    // Check if there's a unique constraint on mobile
    const idx = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='customers'");
    console.log('customer indexes:', idx.rows);
  }

  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
