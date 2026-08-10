/**
 * import-to-cloud.js
 * Imports data from local-data-export.json into the cloud DB (Render/Neon).
 * Usage: DATABASE_URL="postgres://..." node backend/import-to-cloud.js
 *
 * Safe: skips rows that already exist (by id or unique key).
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: Set DATABASE_URL env var first.');
  console.error('Usage: DATABASE_URL="postgres://..." node backend/import-to-cloud.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importData() {
  const dataPath = path.join(__dirname, 'local-data-export.json');
  if (!fs.existsSync(dataPath)) {
    console.error('ERROR: backend/local-data-export.json not found.');
    console.error('Run: node backend/export-local-data.js first');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const client = await pool.connect();

  try {
    console.log(`Importing data exported at: ${data.exported_at}\n`);
    await client.query('BEGIN');

    // ── Users ──────────────────────────────────────────────────────────────────
    // Cloud may have already seeded admin/staff with different IDs.
    // Build a mapping: localUserId → cloudUserId so invoices can reference correctly.
    const userIdMap = {}; // localId -> cloudId
    let inserted = 0;
    for (const u of data.users) {
      const exists = await client.query('SELECT id FROM users WHERE username=$1', [u.username]);
      if (exists.rows.length === 0) {
        const res = await client.query(
          `INSERT INTO users (name, username, password_hash, role, active, created_at)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [u.name, u.username, u.password_hash, u.role, u.active, u.created_at]
        );
        userIdMap[u.id] = res.rows[0].id;
        inserted++;
      } else {
        userIdMap[u.id] = exists.rows[0].id;
      }
    }
    console.log(`✓ users:         ${inserted} inserted, ${data.users.length - inserted} skipped`);

    // ── Products ───────────────────────────────────────────────────────────────
    inserted = 0;
    for (const p of data.products) {
      const exists = await client.query('SELECT id FROM products WHERE id=$1', [p.id]);
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO products (id, name, category, description, cost_price, selling_price,
             stock, hsn_code, gst_rate, image_url, active, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [p.id, p.name, p.category, p.description, p.cost_price, p.selling_price,
           p.stock, p.hsn_code, p.gst_rate, p.image_url, p.active, p.created_at]
        );
        inserted++;
      }
    }
    console.log(`✓ products:      ${inserted} inserted, ${data.products.length - inserted} skipped`);

    // ── Customers ──────────────────────────────────────────────────────────────
    // Build mapping: localCustomerId → cloudCustomerId (cloud may have seeded some already)
    const customerIdMap = {};
    inserted = 0;
    for (const c of data.customers) {
      const exists = await client.query('SELECT id FROM customers WHERE mobile=$1', [c.mobile]);
      if (exists.rows.length === 0) {
        const res = await client.query(
          `INSERT INTO customers (id, name, mobile, email, address, created_at)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [c.id, c.name, c.mobile, c.email, c.address, c.created_at]
        );
        customerIdMap[c.id] = res.rows[0].id;
        inserted++;
      } else {
        customerIdMap[c.id] = exists.rows[0].id;
      }
    }
    console.log(`✓ customers:     ${inserted} inserted, ${data.customers.length - inserted} skipped`);

    // ── Brokers ────────────────────────────────────────────────────────────────
    inserted = 0;
    for (const b of data.brokers) {
      const exists = await client.query('SELECT id FROM brokers WHERE id=$1', [b.id]);
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO brokers (id, name, mobile, default_discount_pct, active, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [b.id, b.name, b.mobile, b.default_discount_pct, b.active, b.created_at]
        );
        inserted++;
      }
    }
    console.log(`✓ brokers:       ${inserted} inserted, ${data.brokers.length - inserted} skipped`);

    // ── Invoices ───────────────────────────────────────────────────────────────
    // Remap created_by / cancelled_by to cloud user IDs, customer_id to cloud customer IDs
    inserted = 0;
    for (const inv of data.invoices) {
      const exists = await client.query('SELECT id FROM invoices WHERE id=$1', [inv.id]);
      if (exists.rows.length === 0) {
        const createdBy   = userIdMap[inv.created_by]     || inv.created_by;
        const cancelledBy = inv.cancelled_by ? (userIdMap[inv.cancelled_by] || inv.cancelled_by) : null;
        const customerId  = customerIdMap[inv.customer_id] || inv.customer_id;
        await client.query(
          `INSERT INTO invoices (id, invoice_number, date, customer_id, subtotal,
             customer_discount_type, customer_discount_pct, customer_discount_amt,
             broker_id, broker_discount_type, broker_discount_pct, broker_discount_amt,
             taxable_amount, gst_amount, net_payable, payment_mode,
             cancelled, cancelled_at, cancelled_by, created_by, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [inv.id, inv.invoice_number, inv.date, customerId, inv.subtotal,
           inv.customer_discount_type, inv.customer_discount_pct, inv.customer_discount_amt,
           inv.broker_id, inv.broker_discount_type, inv.broker_discount_pct, inv.broker_discount_amt,
           inv.taxable_amount, inv.gst_amount, inv.net_payable, inv.payment_mode,
           inv.cancelled || false, inv.cancelled_at, cancelledBy, createdBy, inv.created_at]
        );
        inserted++;
      }
    }
    console.log(`✓ invoices:      ${inserted} inserted, ${data.invoices.length - inserted} skipped`);

    // ── Invoice Items ──────────────────────────────────────────────────────────
    inserted = 0;
    for (const item of data.invoice_items) {
      const exists = await client.query('SELECT id FROM invoice_items WHERE id=$1', [item.id]);
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO invoice_items (id, invoice_id, product_id, product_name,
             category, hsn_code, gst_rate, qty, rate, amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [item.id, item.invoice_id, item.product_id, item.product_name,
           item.category, item.hsn_code, item.gst_rate, item.qty, item.rate, item.amount]
        );
        inserted++;
      }
    }
    console.log(`✓ invoice_items: ${inserted} inserted, ${data.invoice_items.length - inserted} skipped`);

    await client.query('COMMIT');
    console.log('\n✅ Import complete! All your local data is now in the cloud DB.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

importData();
