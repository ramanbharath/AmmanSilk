/**
 * setup-cloud-db.js
 * Run this ONCE on Render Shell to create all tables and seed initial data.
 * Usage:  node backend/setup-cloud-db.js
 *
 * Uses DATABASE_URL environment variable (automatically set by Render Postgres).
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: 'localhost', port: 5432, database: 'ammansilks_db', user: 'postgres', password: 'postgres' });

async function setup() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Running setup...\n');

    // ── Create Tables ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN','STAFF')),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ users table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS brokers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        default_discount_pct DECIMAL(5,2) DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ brokers table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        cost_price DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        stock INTEGER DEFAULT 0,
        hsn_code VARCHAR(20) DEFAULT '5007',
        gst_rate DECIMAL(4,2) DEFAULT 5.00,
        image_url VARCHAR(500),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ products table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(150),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ customers table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(20) UNIQUE NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        customer_id UUID NOT NULL REFERENCES customers(id),
        subtotal DECIMAL(10,2) NOT NULL,
        customer_discount_type VARCHAR(10) DEFAULT 'PERCENT' CHECK (customer_discount_type IN ('PERCENT','FLAT')),
        customer_discount_pct DECIMAL(5,2) DEFAULT 0,
        customer_discount_amt DECIMAL(10,2) DEFAULT 0,
        broker_id UUID REFERENCES brokers(id),
        broker_discount_type VARCHAR(10) DEFAULT 'PERCENT' CHECK (broker_discount_type IN ('PERCENT','FLAT')),
        broker_discount_pct DECIMAL(5,2) DEFAULT 0,
        broker_discount_amt DECIMAL(10,2) DEFAULT 0,
        taxable_amount DECIMAL(10,2) NOT NULL,
        gst_amount DECIMAL(10,2) DEFAULT 0,
        net_payable DECIMAL(10,2) NOT NULL,
        payment_mode VARCHAR(10) DEFAULT 'CASH' CHECK (payment_mode IN ('CASH','UPI','CARD')),
        cancelled BOOLEAN DEFAULT FALSE,
        cancelled_at TIMESTAMP,
        cancelled_by UUID REFERENCES users(id),
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ invoices table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        product_name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        hsn_code VARCHAR(20),
        gst_rate DECIMAL(4,2),
        qty INTEGER NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL
      )
    `);
    console.log('✓ invoice_items table');

    // ── Seed Admin User ────────────────────────────────────────────────────────
    const existing = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (existing.rows.length === 0) {
      const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
      const adminHash = await bcrypt.hash(adminPass, 10);
      await client.query(
        `INSERT INTO users (name, username, password_hash, role) VALUES ($1,$2,$3,$4)`,
        ['Admin', 'admin', adminHash, 'ADMIN']
      );
      console.log('✓ admin user seeded  (username: admin)');
    } else {
      console.log('– admin user already exists, skipped');
    }

    // ── Seed Staff User ────────────────────────────────────────────────────────
    const existingStaff = await client.query(`SELECT id FROM users WHERE username = 'staff'`);
    if (existingStaff.rows.length === 0) {
      const staffPass = process.env.STAFF_PASSWORD || 'staff123';
      const staffHash = await bcrypt.hash(staffPass, 10);
      await client.query(
        `INSERT INTO users (name, username, password_hash, role) VALUES ($1,$2,$3,$4)`,
        ['Billing Staff', 'staff', staffHash, 'STAFF']
      );
      console.log('✓ staff user seeded  (username: staff)');
    } else {
      console.log('– staff user already exists, skipped');
    }

    // ── Seed Brokers ───────────────────────────────────────────────────────────
    const brokerCount = await client.query(`SELECT COUNT(*) FROM brokers`);
    if (parseInt(brokerCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO brokers (name, mobile, default_discount_pct) VALUES
          ('Rajan',   '9876543210', 3.00),
          ('Murugan', '9876543211', 5.00),
          ('Selvi',   '9876543212', 3.00)
      `);
      console.log('✓ 3 brokers seeded');
    } else {
      console.log('– brokers already exist, skipped');
    }

    // ── Seed Sample Products ───────────────────────────────────────────────────
    const productCount = await client.query(`SELECT COUNT(*) FROM products`);
    if (parseInt(productCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO products (name, category, cost_price, selling_price, stock, hsn_code, gst_rate)
        VALUES
          ('Kanchipuram Pure Silk',   'Bridal',     8000,  12000, 15, '5007', 5),
          ('Banarasi Silk',           'Wedding',    5500,   8500, 20, '5007', 5),
          ('Mysore Silk',             'Casual',     2500,   4500, 30, '5007', 5),
          ('Pattu Silk Plain',        'Daily Wear', 1500,   2800, 50, '5007', 5),
          ('Kanchipuram Zari Border', 'Festive',   10000,  15000, 10, '5007', 5),
          ('Chanderi Silk',           'Office Wear',3000,   5500, 25, '5007', 5),
          ('Pochampally Ikat',        'Casual',     2000,   3500, 35, '5007', 5),
          ('Dharmavaram Silk',        'Bridal',     9000,  14000,  8, '5007', 5)
      `);
      console.log('✓ 8 products seeded');
    } else {
      console.log('– products already exist, skipped');
    }

    console.log('\n✅ Database setup complete!');
    console.log('   Login at your app with:');
    console.log('   Admin → username: admin   password: admin123');
    console.log('   Staff → username: staff   password: staff123');
    console.log('\n⚠️  Change passwords after first login via Admin → Users page.');

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

setup();
