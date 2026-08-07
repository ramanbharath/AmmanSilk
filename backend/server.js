const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Load .env if present (optional – falls back to hardcoded defaults for local dev)
try { require('dotenv').config(); } catch (_) {}

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve Angular static files in production ──────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist', 'ammansilks-app', 'browser');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
}

const JWT_SECRET = process.env.JWT_SECRET || 'ammansilks_jwt_secret_local_dev';

// Support Render/Neon DATABASE_URL (connection string) or individual vars for local dev
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }   // required for Render/Neon managed Postgres
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'ammansilks_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

// ── Global error handler helper ───────────────────────────────────────────────
function handleError(res, err, msg = 'Internal server error') {
  console.error(err);
  res.status(500).json({ message: msg, error: err.message });
}

// ── Auth Middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
  next();
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    const result = await pool.query('SELECT * FROM users WHERE username=$1 AND active=true', [username]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, name: user.name, username: user.username, role: user.role },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
  } catch (err) { handleError(res, err, 'Login failed'); }
});

// ── USERS (Admin only) ────────────────────────────────────────────────────────
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, username, role, active, created_at FROM users ORDER BY created_at');
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ message: 'name, username, password, role are required' });
    if (!['ADMIN','STAFF'].includes(role)) return res.status(400).json({ message: 'role must be ADMIN or STAFF' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, username, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id,name,username,role,active,created_at',
      [name, username, hash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Username already exists' });
    handleError(res, err);
  }
});

app.put('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, role, active } = req.body;
    if (role && !['ADMIN','STAFF'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const result = await pool.query(
      'UPDATE users SET name=COALESCE($1,name), role=COALESCE($2,role), active=COALESCE($3,active) WHERE id=$4 RETURNING id,name,username,role,active',
      [name||null, role||null, active!=null?active:null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

app.put('/api/users/:id/password', auth, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
app.get('/api/products', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE active=true ORDER BY name');
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.post('/api/products', auth, adminOnly, async (req, res) => {
  try {
    const { name, category, description, costPrice, sellingPrice, stock, hsnCode, gstRate, imageUrl } = req.body;
    if (!name || !category || costPrice == null || sellingPrice == null || stock == null)
      return res.status(400).json({ message: 'name, category, costPrice, sellingPrice, stock are required' });
    if (costPrice < 0 || sellingPrice < 0 || stock < 0)
      return res.status(400).json({ message: 'Prices and stock must be non-negative' });
    const result = await pool.query(
      `INSERT INTO products (name, category, description, cost_price, selling_price, stock, hsn_code, gst_rate, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, category, description||null, costPrice, sellingPrice, stock, hsnCode||'5007', gstRate||5, imageUrl||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

app.put('/api/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, category, description, costPrice, sellingPrice, stock, hsnCode, gstRate, imageUrl } = req.body;
    if (!name || !category || costPrice == null || sellingPrice == null || stock == null)
      return res.status(400).json({ message: 'name, category, costPrice, sellingPrice, stock are required' });
    const result = await pool.query(
      `UPDATE products SET name=$1, category=$2, description=$3, cost_price=$4,
       selling_price=$5, stock=$6, hsn_code=$7, gst_rate=$8, image_url=$9 WHERE id=$10 RETURNING *`,
      [name, category, description||null, costPrice, sellingPrice, stock, hsnCode, gstRate, imageUrl||null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

app.delete('/api/products/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE products SET active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
app.get('/api/customers', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers ORDER BY name';
    let params = [];
    if (search) {
      query = 'SELECT * FROM customers WHERE name ILIKE $1 OR mobile ILIKE $1 ORDER BY name';
      params = [`%${search}%`];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.post('/api/customers', auth, async (req, res) => {
  try {
    const { name, mobile, email, address } = req.body;
    if (!name || !mobile) return res.status(400).json({ message: 'name and mobile are required' });
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ message: 'mobile must be exactly 10 digits' });
    const existing = await pool.query('SELECT * FROM customers WHERE mobile=$1', [mobile]);
    if (existing.rows.length > 0) return res.json(existing.rows[0]);
    const result = await pool.query(
      'INSERT INTO customers (name, mobile, email, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, mobile, email||null, address||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

app.put('/api/customers/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, mobile, email, address } = req.body;
    if (!name || !mobile) return res.status(400).json({ message: 'name and mobile are required' });
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ message: 'mobile must be exactly 10 digits' });
    const result = await pool.query(
      'UPDATE customers SET name=$1, mobile=$2, email=$3, address=$4 WHERE id=$5 RETURNING *',
      [name, mobile, email||null, address||null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Mobile number already used by another customer' });
    handleError(res, err);
  }
});

// ── BROKERS ───────────────────────────────────────────────────────────────────
app.get('/api/brokers', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM brokers WHERE active=true ORDER BY name');
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.post('/api/brokers', auth, adminOnly, async (req, res) => {
  try {
    const { name, mobile, defaultDiscountPct } = req.body;
    if (!name || !mobile) return res.status(400).json({ message: 'name and mobile are required' });
    const result = await pool.query(
      'INSERT INTO brokers (name, mobile, default_discount_pct) VALUES ($1,$2,$3) RETURNING *',
      [name, mobile, defaultDiscountPct || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

app.put('/api/brokers/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, mobile, defaultDiscountPct, active } = req.body;
    if (!name || !mobile) return res.status(400).json({ message: 'name and mobile are required' });
    const result = await pool.query(
      'UPDATE brokers SET name=$1, mobile=$2, default_discount_pct=$3, active=$4 WHERE id=$5 RETURNING *',
      [name, mobile, defaultDiscountPct, active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Broker not found' });
    res.json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

// ── INVOICES ──────────────────────────────────────────────────────────────────
function generateInvoiceNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  // Use timestamp millis (last 5 digits) for near-zero collision probability
  const tail = String(Date.now()).slice(-5);
  return `AS${yy}${mm}${tail}`;
}

app.post('/api/invoices', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      date, customer, items,
      subtotal, customerDiscountType, customerDiscountPct, customerDiscountAmt,
      broker, brokerDiscountType, brokerDiscountPct, brokerDiscountAmt,
      taxableAmount, gstAmount, netPayable, paymentMode
    } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.mobile)
      return res.status(400).json({ message: 'customer.name and customer.mobile are required' });
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'At least one item is required' });
    if (!/^\d{10}$/.test(customer.mobile))
      return res.status(400).json({ message: 'Customer mobile must be exactly 10 digits' });

    // Check stock availability before proceeding
    for (const item of items) {
      const stockRes = await client.query('SELECT stock, name FROM products WHERE id=$1', [item.productId]);
      if (stockRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }
      const available = stockRes.rows[0].stock;
      if (item.qty > available) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Insufficient stock for "${stockRes.rows[0].name}". Available: ${available}, Requested: ${item.qty}`
        });
      }
    }

    // Only admin can save broker discount
    const finalBrokerId = req.user.role === 'ADMIN' ? (broker?.id || null) : null;
    const finalBrokerDiscPct = req.user.role === 'ADMIN' ? (brokerDiscountPct || 0) : 0;
    const finalBrokerDiscAmt = req.user.role === 'ADMIN' ? (brokerDiscountAmt || 0) : 0;
    const finalBrokerDiscType = req.user.role === 'ADMIN' ? (brokerDiscountType || 'PERCENT') : 'PERCENT';

    // Upsert customer
    let customerId = customer.id;
    if (!customerId) {
      const cust = await client.query(
        'INSERT INTO customers (name, mobile, email, address) VALUES ($1,$2,$3,$4) ON CONFLICT (mobile) DO UPDATE SET name=EXCLUDED.name RETURNING id',
        [customer.name, customer.mobile, customer.email || null, customer.address || null]
      );
      customerId = cust.rows[0].id;
    }

    // Build date from local parts to avoid UTC midnight → yesterday timezone shift
    const now2 = new Date();
    const localToday = `${now2.getFullYear()}-${String(now2.getMonth()+1).padStart(2,'0')}-${String(now2.getDate()).padStart(2,'0')}`;
    const invoiceDate = date || localToday;
    const invoiceNumber = generateInvoiceNumber();

    const invResult = await client.query(
      `INSERT INTO invoices (invoice_number, date, customer_id, subtotal,
        customer_discount_type, customer_discount_pct, customer_discount_amt,
        broker_id, broker_discount_type, broker_discount_pct, broker_discount_amt,
        taxable_amount, gst_amount, net_payable, payment_mode, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [invoiceNumber, invoiceDate, customerId, subtotal,
       customerDiscountType || 'PERCENT', customerDiscountPct || 0, customerDiscountAmt || 0,
       finalBrokerId, finalBrokerDiscType, finalBrokerDiscPct, finalBrokerDiscAmt,
       taxableAmount, gstAmount || 0, netPayable, paymentMode || 'CASH', req.user.id]
    );
    const invoice = invResult.rows[0];

    // Insert items & deduct stock
    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name, category, hsn_code, gst_rate, qty, rate, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [invoice.id, item.productId, item.productName, item.category, item.hsnCode, item.gstRate, item.qty, item.rate, item.amount]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.qty, item.productId]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...invoice, invoiceNumber: invoice.invoice_number });
  } catch (err) {
    await client.query('ROLLBACK');
    handleError(res, err, 'Failed to save invoice');
  } finally {
    client.release();
  }
});

app.get('/api/invoices', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT i.*, c.name as customer_name, c.mobile as customer_mobile,
             b.name as broker_name, u.name as created_by_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN brokers b ON i.broker_id = b.id
      JOIN users u ON i.created_by = u.id
      WHERE i.cancelled = false
    `;
    const params = [];
    if (from) { params.push(from); query += ` AND i.date >= $${params.length}`; }
    if (to)   { params.push(to);   query += ` AND i.date <= $${params.length}`; }
    query += ' ORDER BY i.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.get('/api/invoices/:id', auth, async (req, res) => {
  try {
    const inv = await pool.query(
      `SELECT i.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address,
              b.name as broker_name, u.name as created_by_name
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       LEFT JOIN brokers b ON i.broker_id = b.id
       JOIN users u ON i.created_by = u.id
       WHERE i.id=$1`, [req.params.id]
    );
    if (inv.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id]);
    res.json({ ...inv.rows[0], items: items.rows });
  } catch (err) { handleError(res, err); }
});

// Cancel invoice — restores stock
app.post('/api/invoices/:id/cancel', auth, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inv = await client.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (inv.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (inv.rows[0].cancelled) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invoice is already cancelled' });
    }
    // Restore stock for each item
    const items = await client.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id]);
    for (const item of items.rows) {
      await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.qty, item.product_id]);
    }
    await client.query('UPDATE invoices SET cancelled=true, cancelled_at=NOW(), cancelled_by=$1 WHERE id=$2',
      [req.user.id, req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    handleError(res, err, 'Failed to cancel invoice');
  } finally {
    client.release();
  }
});

// ── REPORTS ───────────────────────────────────────────────────────────────────
app.get('/api/reports/sales', auth, adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [from || '2000-01-01', to || '2099-12-31'];
    const [summary, products, invoices] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total_bills,
          COALESCE(SUM(subtotal), 0) as total_gross,
          COALESCE(SUM(customer_discount_amt), 0) as total_customer_discount,
          COALESCE(SUM(broker_discount_amt), 0) as total_broker_discount,
          COALESCE(SUM(gst_amount), 0) as total_gst,
          COALESCE(SUM(net_payable), 0) as net_revenue
        FROM invoices WHERE date BETWEEN $1 AND $2 AND cancelled = false
      `, params),
      pool.query(`
        SELECT
          ii.product_name, ii.category,
          SUM(ii.qty) as total_qty,
          SUM(ii.amount) as total_amount
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.date BETWEEN $1 AND $2 AND i.cancelled = false
        GROUP BY ii.product_name, ii.category
        ORDER BY total_amount DESC
      `, params),
      pool.query(`
        SELECT i.id, i.invoice_number, i.date, i.net_payable, i.payment_mode,
               c.name as customer_name, c.mobile as customer_mobile
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.date BETWEEN $1 AND $2 AND i.cancelled = false
        ORDER BY i.created_at DESC
      `, params)
    ]);
    res.json({ ...summary.rows[0], products: products.rows, invoices: invoices.rows });
  } catch (err) { handleError(res, err); }
});

app.get('/api/reports/broker', auth, adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [from || '2000-01-01', to || '2099-12-31'];
    const result = await pool.query(`
      SELECT
        b.id as broker_id, b.name as broker_name,
        COUNT(i.id) as total_bills,
        COALESCE(SUM(i.subtotal), 0) as total_sale_value,
        COALESCE(SUM(i.broker_discount_amt), 0) as total_broker_discount,
        CASE WHEN SUM(i.subtotal) > 0
             THEN ROUND(SUM(i.broker_discount_amt) / SUM(i.subtotal) * 100, 2)
             ELSE 0 END as avg_discount_pct
      FROM brokers b
      LEFT JOIN invoices i ON i.broker_id = b.id AND i.date BETWEEN $1 AND $2 AND i.cancelled = false
      WHERE b.active=true
      GROUP BY b.id, b.name ORDER BY b.name
    `, params);
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.get('/api/reports/customer', auth, adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [from || '2000-01-01', to || '2099-12-31'];
    const result = await pool.query(`
      SELECT
        c.id as customer_id, c.name as customer_name, c.mobile,
        COUNT(i.id) as total_bills,
        COALESCE(SUM(i.net_payable), 0) as total_purchase,
        COALESCE(SUM(i.customer_discount_amt), 0) as total_customer_discount
      FROM customers c
      JOIN invoices i ON i.customer_id = c.id
      WHERE i.date BETWEEN $1 AND $2 AND i.cancelled = false
      GROUP BY c.id, c.name, c.mobile ORDER BY total_purchase DESC
    `, params);
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

// ── STOCK ─────────────────────────────────────────────────────────────────────
app.get('/api/stock', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, category, stock, selling_price FROM products WHERE active=true ORDER BY stock ASC'
    );
    res.json(result.rows);
  } catch (err) { handleError(res, err); }
});

app.put('/api/stock/:id', auth, adminOnly, async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock == null || stock < 0) return res.status(400).json({ message: 'stock must be a non-negative number' });
    const result = await pool.query('UPDATE products SET stock=$1 WHERE id=$2 RETURNING *', [stock, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { handleError(res, err); }
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'AmmanSilks API is running' }));

// ── Angular SPA catch-all (must be LAST, after all /api routes) ───────────────
app.get('*', (req, res) => {
  const index = path.join(distPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.json({ status: 'AmmanSilks API is running' });
  }
});

// ── AUTO DB SETUP (runs on every start — safe, idempotent) ───────────────────
async function autoSetupDb() {
  const client = await pool.connect();
  try {
    console.log('[DB] Running auto-setup...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN','STAFF')),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brokers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        default_discount_pct DECIMAL(5,2) DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )`);

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
      )`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(150),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`);

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
      )`);

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
      )`);

    // Add cancelled columns if missing — use DO block to safely ignore "already exists" errors
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE;
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
      EXCEPTION WHEN others THEN NULL;
      END $$`);

    // Add cancelled_by FK separately — only if column doesn't already exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='invoices' AND column_name='cancelled_by'
        ) THEN
          ALTER TABLE invoices ADD COLUMN cancelled_by UUID REFERENCES users(id);
        END IF;
      EXCEPTION WHEN others THEN NULL;
      END $$`);

    // Seed admin user if not present — hash generated at runtime from env var
    const adminExists = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (adminExists.rows.length === 0) {
      const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
      const adminHash = await bcrypt.hash(adminPass, 10);
      await client.query(
        `INSERT INTO users (name, username, password_hash, role) VALUES ($1,$2,$3,$4)`,
        ['Admin', 'admin', adminHash, 'ADMIN']
      );
      console.log('[DB] Admin user created');
    }

    // Seed staff user if not present — hash generated at runtime from env var
    const staffExists = await client.query(`SELECT id FROM users WHERE username = 'staff'`);
    if (staffExists.rows.length === 0) {
      const staffPass = process.env.STAFF_PASSWORD || 'staff123';
      const staffHash = await bcrypt.hash(staffPass, 10);
      await client.query(
        `INSERT INTO users (name, username, password_hash, role) VALUES ($1,$2,$3,$4)`,
        ['Billing Staff', 'staff', staffHash, 'STAFF']
      );
      console.log('[DB] Staff user created');
    }

    // Seed sample products if none exist
    const prodCount = await client.query(`SELECT COUNT(*) FROM products`);
    if (parseInt(prodCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO products (name, category, cost_price, selling_price, stock, hsn_code, gst_rate) VALUES
          ('Kanchipuram Pure Silk',   'Bridal',      8000, 12000, 15, '5007', 5),
          ('Banarasi Silk',           'Wedding',     5500,  8500, 20, '5007', 5),
          ('Mysore Silk',             'Casual',      2500,  4500, 30, '5007', 5),
          ('Pattu Silk Plain',        'Daily Wear',  1500,  2800, 50, '5007', 5),
          ('Kanchipuram Zari Border', 'Festive',    10000, 15000, 10, '5007', 5),
          ('Chanderi Silk',           'Office Wear', 3000,  5500, 25, '5007', 5),
          ('Pochampally Ikat',        'Casual',      2000,  3500, 35, '5007', 5),
          ('Dharmavaram Silk',        'Bridal',      9000, 14000,  8, '5007', 5)`);
      console.log('[DB] Sample products seeded');
    }

    // Seed sample brokers if none exist
    const brokerCount = await client.query(`SELECT COUNT(*) FROM brokers`);
    if (parseInt(brokerCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO brokers (name, mobile, default_discount_pct) VALUES
          ('Rajan',   '9876543210', 3.00),
          ('Murugan', '9876543211', 5.00),
          ('Selvi',   '9876543212', 3.00)`);
      console.log('[DB] Sample brokers seeded');
    }

    console.log('[DB] Auto-setup complete ✓');
  } catch (err) {
    console.error('[DB] Auto-setup error:', err.message);
    throw err;  // re-throw so server does NOT start with broken DB
  } finally {
    client.release();
  }
}

// ── START — setup DB first, then open port ───────────────────────────────────
const PORT = process.env.PORT || 3000;
autoSetupDb().then(() => {
  app.listen(PORT, () => console.log(`AmmanSilks API running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Fatal: DB setup failed, cannot start server:', err.message);
  process.exit(1);
});
