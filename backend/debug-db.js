const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'ammansilks_db', user: 'postgres', password: 'postgres' });

async function diagnose() {
  try {
    // 1. Check invoices table columns
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='invoices' ORDER BY ordinal_position"
    );
    console.log('\n=== INVOICES TABLE COLUMNS ===');
    cols.rows.forEach(c => console.log(' ', c.column_name, '-', c.data_type));

    // 2. Check how many invoices exist (including any cancelled flag issues)
    const count = await pool.query('SELECT COUNT(*) as total FROM invoices');
    console.log('\n=== TOTAL INVOICES IN DB ===', count.rows[0].total);

    // 3. Try to check if cancelled column exists
    const hasCancelled = cols.rows.find(c => c.column_name === 'cancelled');
    if (!hasCancelled) {
      console.log('\n!!! MISSING COLUMN: "cancelled" does not exist in invoices table !!!');
      console.log('!!! This is why invoice saves FAIL — the WHERE clause uses cancelled=false !!!');
    } else {
      console.log('\n"cancelled" column EXISTS — OK');
    }

    // 4. Check last 5 invoices
    const recent = await pool.query('SELECT invoice_number, date, net_payable, created_at FROM invoices ORDER BY created_at DESC LIMIT 5');
    console.log('\n=== LAST 5 INVOICES ===');
    if (recent.rows.length === 0) console.log('  (none found)');
    recent.rows.forEach(r => console.log(' ', r.invoice_number, r.date, '₹'+r.net_payable, r.created_at));

    // 5. Check invoice_items count
    const items = await pool.query('SELECT COUNT(*) as total FROM invoice_items');
    console.log('\n=== TOTAL INVOICE ITEMS IN DB ===', items.rows[0].total);

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    pool.end();
  }
}

diagnose();
