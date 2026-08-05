# AmmanSilks — Billing & Management System

Angular 20 + Node.js + PostgreSQL billing system for AmmanSilks saree shop.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Angular CLI (`npm install -g @angular/cli`)

---

### Step 1 — Setup PostgreSQL Database

```bash
# Open psql and run the schema file
psql -U postgres -f backend/schema.sql
```

This creates the database, all tables, and seeds:
- Admin user: `admin` / `admin123`
- Staff user:  `staff` / `staff123`
- 3 sample brokers, 8 sample saree products

---

### Step 2 — Start Backend API

```bash
cd backend
npm install
node server.js
# API running at http://localhost:3000
```

> To use nodemon for auto-reload: `npx nodemon server.js`

---

### Step 3 — Start Angular App

```bash
# From root of ammansilks-app/
npm install
ng serve
# App running at http://localhost:4200
```

---

## Login Credentials (Local)

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |
| Staff | staff    | staff123  |

---

## Module Overview

| Module        | Route             | Access      |
|---------------|-------------------|-------------|
| Login         | /login            | Public      |
| Dashboard     | /admin/dashboard  | Admin only  |
| Products      | /admin/products   | Admin only  |
| Brokers       | /admin/brokers    | Admin only  |
| Stock         | /admin/stock      | Admin only  |
| POS Billing   | /billing/pos      | Admin+Staff |
| Invoice View  | /billing/invoice/:id | Admin+Staff |
| Sales Report  | /reports/sales    | Admin only  |
| Broker Report | /reports/broker   | Admin only  |
| Customer Report | /reports/customer | Admin only |

---

## Discount Rules

| Discount         | Applied By   | Visible on Customer Invoice |
|------------------|--------------|-----------------------------|
| Customer Discount | Admin + Staff | YES                         |
| Broker Discount   | Admin only   | NO (admin copy only)        |

---

## Project Structure

```
ammansilks-app/
├── backend/
│   ├── server.js          # Node.js Express API
│   ├── schema.sql         # PostgreSQL schema + seed data
│   └── package.json
└── src/app/
    ├── auth/              # Login, JWT, Guards
    ├── admin/             # Dashboard, Products, Brokers, Stock
    ├── billing/           # POS Screen, Invoice Preview
    ├── reports/           # Sales, Broker, Customer reports
    ├── shared/            # Services, Models, Sidebar
    └── core/              # Auth Interceptor
```
