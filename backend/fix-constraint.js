const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', port:5432, database:'ammansilks_db', user:'postgres', password:'postgres' });

async function run() {
  // Add unique constraint on customers.mobile
  try {
    await pool.query('ALTER TABLE customers ADD CONSTRAINT customers_mobile_unique UNIQUE (mobile)');
    console.log('Added UNIQUE constraint on customers.mobile');
  } catch(e) {
    console.log('Constraint already exists or error:', e.message);
  }

  // Verify
  const idx = await pool.query("SELECT indexname FROM pg_indexes WHERE tablename='customers'");
  console.log('customers indexes now:', idx.rows.map(r => r.indexname));

  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
