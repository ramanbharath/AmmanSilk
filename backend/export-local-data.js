/**
 * export-local-data.js
 * Exports all data from local DB to a JSON file: backend/local-data-export.json
 * Usage: node backend/export-local-data.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'ammansilks_db', user: 'postgres', password: 'postgres'
});

async function exportData() {
  try {
    console.log('Exporting local data...');

    const [users, products, customers, brokers, invoices, items] = await Promise.all([
      pool.query('SELECT * FROM users ORDER BY created_at'),
      pool.query('SELECT * FROM products ORDER BY created_at'),
      pool.query('SELECT * FROM customers ORDER BY created_at'),
      pool.query('SELECT * FROM brokers ORDER BY created_at'),
      pool.query('SELECT * FROM invoices ORDER BY created_at'),
      pool.query('SELECT * FROM invoice_items')
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      users:         users.rows,
      products:      products.rows,
      customers:     customers.rows,
      brokers:       brokers.rows,
      invoices:      invoices.rows,
      invoice_items: items.rows
    };

    const outPath = path.join(__dirname, 'local-data-export.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

    console.log(`\n✅ Export complete: backend/local-data-export.json`);
    console.log(`   users:         ${data.users.length}`);
    console.log(`   products:      ${data.products.length}`);
    console.log(`   customers:     ${data.customers.length}`);
    console.log(`   brokers:       ${data.brokers.length}`);
    console.log(`   invoices:      ${data.invoices.length}`);
    console.log(`   invoice_items: ${data.invoice_items.length}`);
    console.log('\nNext step: run import script pointing at Render DATABASE_URL');
  } catch (e) {
    console.error('Export error:', e.message);
  } finally {
    pool.end();
  }
}

exportData();
