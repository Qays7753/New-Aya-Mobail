-- =================== PRODUCTS ===================
CREATE TABLE products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  sku          TEXT UNIQUE,
  category     TEXT NOT NULL CHECK(category IN (
                 'device','sim','service_general',
                 'service_repair','accessory','package')),
  sale_price   INTEGER NOT NULL DEFAULT 0,  -- fils
  stock_qty    INTEGER NOT NULL DEFAULT 0,
  min_stock    INTEGER NOT NULL DEFAULT 0,
  track_stock  INTEGER NOT NULL DEFAULT 1,  -- boolean
  is_quick_add INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  notes        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);

-- =================== ACCOUNTS ===================
CREATE TABLE accounts (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK(type IN (
                    'cash','card','bank','wallet','receivable','payable')),
  balance         INTEGER NOT NULL DEFAULT 0,  -- fils
  fee_percent     INTEGER NOT NULL DEFAULT 0,  -- بالألف (0.1% = 100)
  module_scope    TEXT,  -- 'pos','maintenance','operations' أو NULL للكل
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

-- =================== CUSTOMERS ===================
CREATE TABLE customers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  balance       INTEGER NOT NULL DEFAULT 0,  -- fils (سالب = مديون)
  credit_limit  INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- =================== SUPPLIERS ===================
CREATE TABLE suppliers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  balance    INTEGER NOT NULL DEFAULT 0,  -- fils
  notes      TEXT,
  created_at TEXT NOT NULL
);

-- =================== INVOICES ===================
CREATE TABLE invoices (
  id               TEXT PRIMARY KEY,
  invoice_number   TEXT NOT NULL UNIQUE,
  invoice_date     TEXT NOT NULL,  -- YYYY-MM-DD
  customer_id      TEXT REFERENCES customers(id),
  subtotal         INTEGER NOT NULL DEFAULT 0,  -- fils
  discount_amount  INTEGER NOT NULL DEFAULT 0,  -- fils
  total_amount     INTEGER NOT NULL DEFAULT 0,  -- fils
  paid_amount      INTEGER NOT NULL DEFAULT 0,  -- fils
  debt_amount      INTEGER NOT NULL DEFAULT 0,  -- fils
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active','returned','cancelled')),
  pos_terminal     TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

CREATE TABLE invoice_items (
  id              TEXT PRIMARY KEY,
  invoice_id      TEXT NOT NULL REFERENCES invoices(id),
  product_id      TEXT REFERENCES products(id),
  product_name    TEXT NOT NULL,
  quantity        INTEGER NOT NULL,
  unit_price      INTEGER NOT NULL,  -- fils
  discount_amount INTEGER NOT NULL DEFAULT 0,  -- fils
  line_total      INTEGER NOT NULL   -- fils
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE invoice_payments (
  id          TEXT PRIMARY KEY,
  invoice_id  TEXT NOT NULL REFERENCES invoices(id),
  account_id  TEXT NOT NULL REFERENCES accounts(id),
  amount      INTEGER NOT NULL,  -- fils
  fee_amount  INTEGER NOT NULL DEFAULT 0  -- fils
);

-- =================== EXPENSES ===================
CREATE TABLE expense_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('fixed','variable')),
  is_active   INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

CREATE TABLE expenses (
  id                  TEXT PRIMARY KEY,
  expense_number      TEXT NOT NULL UNIQUE,
  expense_date        TEXT NOT NULL,
  account_id          TEXT NOT NULL REFERENCES accounts(id),
  category_id         TEXT NOT NULL REFERENCES expense_categories(id),
  amount              INTEGER NOT NULL,  -- fils
  description         TEXT NOT NULL,
  notes               TEXT,
  created_at          TEXT NOT NULL
);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- =================== OPERATIONS ===================
CREATE TABLE topups (
  id            TEXT PRIMARY KEY,
  topup_number  TEXT NOT NULL UNIQUE,
  topup_date    TEXT NOT NULL,
  account_id    TEXT NOT NULL REFERENCES accounts(id),
  supplier_id   TEXT REFERENCES suppliers(id),
  amount        INTEGER NOT NULL,   -- fils (المبلغ المستلم)
  cost          INTEGER NOT NULL,   -- fils (التكلفة)
  profit        INTEGER NOT NULL,   -- fils (الربح = amount - cost)
  notes         TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE transfers (
  id               TEXT PRIMARY KEY,
  transfer_number  TEXT NOT NULL UNIQUE,
  transfer_date    TEXT NOT NULL,
  from_account_id  TEXT NOT NULL REFERENCES accounts(id),
  to_account_id    TEXT NOT NULL REFERENCES accounts(id),
  amount           INTEGER NOT NULL,  -- fils
  notes            TEXT,
  created_at       TEXT NOT NULL
);

-- =================== MAINTENANCE ===================
CREATE TABLE maintenance_jobs (
  id                  TEXT PRIMARY KEY,
  job_number          TEXT NOT NULL UNIQUE,
  job_date            TEXT NOT NULL,
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  device_type         TEXT NOT NULL,
  issue_description   TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'new'
                        CHECK(status IN ('new','in_progress','ready','delivered','cancelled')),
  estimated_cost      INTEGER,       -- fils
  final_amount        INTEGER,       -- fils
  payment_account_id  TEXT REFERENCES accounts(id),
  notes               TEXT,
  delivered_at        TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX idx_maintenance_status ON maintenance_jobs(status);

-- =================== INVENTORY ===================
CREATE TABLE inventory_counts (
  id           TEXT PRIMARY KEY,
  count_date   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK(status IN ('active','completed')),
  notes        TEXT,
  created_at   TEXT NOT NULL
);

CREATE TABLE inventory_count_items (
  id                    TEXT PRIMARY KEY,
  inventory_count_id    TEXT NOT NULL REFERENCES inventory_counts(id),
  product_id            TEXT NOT NULL REFERENCES products(id),
  system_qty            INTEGER NOT NULL,
  actual_qty            INTEGER NOT NULL DEFAULT 0,
  reason                TEXT
);

-- =================== LEDGER ===================
CREATE TABLE ledger_entries (
  id          TEXT PRIMARY KEY,
  entry_date  TEXT NOT NULL,
  account_id  TEXT NOT NULL REFERENCES accounts(id),
  type        TEXT NOT NULL CHECK(type IN ('debit','credit')),
  amount      INTEGER NOT NULL,  -- fils
  ref_type    TEXT,  -- 'invoice','expense','topup','transfer','maintenance','debt_payment'
  ref_id      TEXT,
  description TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);

-- =================== DEBT PAYMENTS ===================
CREATE TABLE debt_payments (
  id           TEXT PRIMARY KEY,
  payment_date TEXT NOT NULL,
  customer_id  TEXT NOT NULL REFERENCES customers(id),
  account_id   TEXT NOT NULL REFERENCES accounts(id),
  amount       INTEGER NOT NULL,  -- fils
  notes        TEXT,
  created_at   TEXT NOT NULL
);

-- =================== APP SEQUENCES ===================
CREATE TABLE sequences (
  name     TEXT PRIMARY KEY,
  last_val INTEGER NOT NULL DEFAULT 0
);
INSERT INTO sequences VALUES ('invoice',0),('expense',0),('topup',0),
  ('transfer',0),('maintenance',0);
