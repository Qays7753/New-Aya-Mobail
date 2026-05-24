-- 009_partial_returns.sql
PRAGMA user_version = 9;

-- Rebuild invoices to widen CHECK constraint to include 'partially_returned'
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
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active','returned','partially_returned','cancelled')),
  pos_terminal     TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL
);

INSERT INTO invoices_new (
  id, invoice_number, invoice_date, customer_id, customer_name, customer_phone,
  subtotal, discount_amount, total_amount, paid_amount, status,
  pos_terminal, notes, created_at
)
SELECT
  id, invoice_number, invoice_date, customer_id, customer_name, customer_phone,
  subtotal, discount_amount, total_amount, paid_amount, status,
  pos_terminal, notes, created_at
FROM invoices;

DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
