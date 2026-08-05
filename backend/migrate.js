const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'ammansilks_db', user: 'postgres', password: 'postgres' });

async function migrate() {
  try {
    console.log('Running migrations...\n');

    // Add cancelled columns if missing
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE`);
    console.log('✓ cancelled column added / already exists');

    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP`);
    console.log('✓ cancelled_at column added / already exists');

    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id)`);
    console.log('✓ cancelled_by column added / already exists');

    // Set all existing rows to cancelled=false explicitly
    const updated = await pool.query(`UPDATE invoices SET cancelled = FALSE WHERE cancelled IS NULL`);
    console.log(`✓ Set cancelled=FALSE on ${updated.rowCount} existing rows`);

    // Verify
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='invoices' AND column_name IN ('cancelled','cancelled_at','cancelled_by')`
    );
    console.log('\n=== Verified columns present ===');
    cols.rows.forEach(c => console.log(' ✓', c.column_name));

    // Show all invoices now visible
    const invoices = await pool.query(`
      SELECT invoice_number, date, net_payable, created_at
      FROM invoices
      WHERE cancelled = false
      ORDER BY created_at DESC
    `);
    console.log(`\n=== All invoices now queryable: ${invoices.rows.length} found ===`);
    invoices.rows.forEach(r => console.log(' ', r.invoice_number, String(r.date).split('T')[0], '₹'+r.net_payable));

    console.log('\n✅ Migration complete. Restart your backend server.');
  } catch (e) {
    console.error('MIGRATION ERROR:', e.message);
  } finally {
    pool.end();
  }
}

migrate();
