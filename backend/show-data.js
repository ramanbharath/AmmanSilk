const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'ammansilks_db', user: 'postgres', password: 'postgres' });

async function showAll() {
  try {
    console.log('\n========== USERS ==========');
    const users = await pool.query('SELECT id, name, username, role, active, created_at FROM users ORDER BY created_at');
    users.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n========== PRODUCTS ==========');
    const products = await pool.query('SELECT id, name, category, cost_price, selling_price, stock, active FROM products ORDER BY name');
    products.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n========== CUSTOMERS ==========');
    const customers = await pool.query('SELECT id, name, mobile, email, address, created_at FROM customers ORDER BY created_at');
    customers.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n========== BROKERS ==========');
    const brokers = await pool.query('SELECT id, name, mobile, default_discount_pct, active FROM brokers ORDER BY name');
    brokers.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n========== INVOICES ==========');
    const invoices = await pool.query(`
      SELECT i.invoice_number, i.date, i.subtotal, i.net_payable, i.payment_mode,
             i.customer_discount_amt, i.gst_amount, i.cancelled, i.created_at,
             c.name as customer_name, c.mobile as customer_mobile,
             b.name as broker_name, u.name as created_by
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN brokers b ON i.broker_id = b.id
      JOIN users u ON i.created_by = u.id
      ORDER BY i.created_at DESC
    `);
    invoices.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n========== INVOICE ITEMS ==========');
    const items = await pool.query(`
      SELECT ii.invoice_id, i.invoice_number, ii.product_name, ii.category,
             ii.qty, ii.rate, ii.amount, ii.gst_rate, ii.hsn_code
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      ORDER BY i.created_at DESC
    `);
    items.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n========== SUMMARY ==========');
    const summary = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)     as users,
        (SELECT COUNT(*) FROM products WHERE active=true) as products,
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM brokers WHERE active=true)  as brokers,
        (SELECT COUNT(*) FROM invoices)  as invoices,
        (SELECT COUNT(*) FROM invoice_items) as invoice_items,
        (SELECT COALESCE(SUM(net_payable),0) FROM invoices WHERE cancelled=false) as total_revenue
    `);
    console.log(JSON.stringify(summary.rows[0]));

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    pool.end();
  }
}
showAll();
