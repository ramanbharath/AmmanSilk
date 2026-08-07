-- AmmanSilks Database Schema
-- Run this on your local PostgreSQL instance

CREATE DATABASE ammansilks_db;
\c ammansilks_db;

-- Users (Admin & Staff)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN','STAFF')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Brokers
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  default_discount_pct DECIMAL(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products (Sarees)
CREATE TABLE products (
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
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(150),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
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
);

-- Migration: run this if upgrading an existing DB
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE;
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);

-- Invoice Line Items
CREATE TABLE invoice_items (
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
);

-- Seed users: run setup-cloud-db.js instead (hashes are generated at runtime)
-- To manually seed: use bcrypt.hash('admin123', 10) and insert the result

-- Seed sample brokers
INSERT INTO brokers (name, mobile, default_discount_pct) VALUES ('Rajan', '9876543210', 3.00);
INSERT INTO brokers (name, mobile, default_discount_pct) VALUES ('Murugan', '9876543211', 5.00);
INSERT INTO brokers (name, mobile, default_discount_pct) VALUES ('Selvi', '9876543212', 3.00);

-- Seed sample products
INSERT INTO products (name, category, cost_price, selling_price, stock, hsn_code, gst_rate)
VALUES
  ('Kanchipuram Pure Silk', 'Bridal', 8000, 12000, 15, '5007', 5),
  ('Banarasi Silk', 'Wedding', 5500, 8500, 20, '5007', 5),
  ('Mysore Silk', 'Casual', 2500, 4500, 30, '5007', 5),
  ('Pattu Silk Plain', 'Daily Wear', 1500, 2800, 50, '5007', 5),
  ('Kanchipuram Zari Border', 'Festive', 10000, 15000, 10, '5007', 5),
  ('Chanderi Silk', 'Office Wear', 3000, 5500, 25, '5007', 5),
  ('Pochampally Ikat', 'Casual', 2000, 3500, 35, '5007', 5),
  ('Dharmavaram Silk', 'Bridal', 9000, 14000, 8, '5007', 5);
