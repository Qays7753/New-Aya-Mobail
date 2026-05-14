-- 002_remove_debts.sql
PRAGMA user_version = 2;

DROP TABLE IF EXISTS debt_payments;
DELETE FROM ledger_entries WHERE ref_type = 'debt_payment';

-- Rebuild invoices (remove debt_amount, add customer_name and customer_phone)
CREATE TABLE invoices_new (
  id               TEXT PRIMARY KEY,
  invoice_number   TEXT NOT NULL UNIQUE,
  invoice_date     TEXT NOT NULL,
  customer_id      TEXT REFERENCES customers(id),
  customer_name    TEXT,
  customer_phone   TEXT,
  subtotal         INTEGER NOT NULL DEFAULT 0,
  discount_amount  INTEGER NOT NULL DEFAULT 0,
  total_amount     INTEGER NOT NULL DEFAULT 0,
  paid_amount      INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','returned','cancelled')),
  pos_terminal     TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL
);
INSERT INTO invoices_new (
  id, invoice_number, invoice_date, customer_id, subtotal, discount_amount, 
  total_amount, paid_amount, status, pos_terminal, notes, created_at
)
SELECT 
  id, invoice_number, invoice_date, customer_id, subtotal, discount_amount, 
  total_amount, paid_amount, status, pos_terminal, notes, created_at 
FROM invoices;
DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

-- Rebuild customers (remove balance, credit_limit)
CREATE TABLE customers_new (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
INSERT INTO customers_new (id, name, phone, notes, created_at, updated_at)
SELECT id, name, phone, notes, created_at, updated_at FROM customers;
DROP TABLE customers;
ALTER TABLE customers_new RENAME TO customers;

-- Rebuild suppliers (remove balance)
CREATE TABLE suppliers_new (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  notes      TEXT,
  created_at TEXT NOT NULL
);
INSERT INTO suppliers_new (id, name, phone, notes, created_at)
SELECT id, name, phone, notes, created_at FROM suppliers;
DROP TABLE suppliers;
ALTER TABLE suppliers_new RENAME TO suppliers;

-- Rebuild accounts (change check constraint to only 'cash','card','bank','wallet')
CREATE TABLE accounts_new (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK(type IN ('cash','card','bank','wallet')),
  balance         INTEGER NOT NULL DEFAULT 0,
  fee_percent     INTEGER NOT NULL DEFAULT 0,
  module_scope    TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);
INSERT INTO accounts_new (id, name, type, balance, fee_percent, module_scope, is_active, sort_order, created_at)
SELECT id, name, type, balance, fee_percent, module_scope, is_active, sort_order, created_at 
FROM accounts WHERE type IN ('cash','card','bank','wallet');
DROP TABLE accounts;
ALTER TABLE accounts_new RENAME TO accounts;
