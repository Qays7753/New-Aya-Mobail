-- 003_snapshots.sql
PRAGMA user_version = 3;

-- Rebuild invoice_items to update ON DELETE cascade to ON DELETE SET NULL for product_id
CREATE TABLE invoice_items_new (
  id              TEXT PRIMARY KEY,
  invoice_id      TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id      TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  quantity        INTEGER NOT NULL,
  unit_price      INTEGER NOT NULL,  -- fils
  discount_amount INTEGER NOT NULL DEFAULT 0,  -- fils
  line_total      INTEGER NOT NULL   -- fils
);
INSERT INTO invoice_items_new (id, invoice_id, product_id, product_name, quantity, unit_price, discount_amount, line_total)
SELECT id, invoice_id, product_id, product_name, quantity, unit_price, discount_amount, line_total FROM invoice_items;
DROP TABLE invoice_items;
ALTER TABLE invoice_items_new RENAME TO invoice_items;

-- Rebuild expenses
CREATE TABLE expenses_new (
  id                  TEXT PRIMARY KEY,
  expense_number      TEXT NOT NULL UNIQUE,
  expense_date        TEXT NOT NULL,
  account_id          TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  category_id         TEXT REFERENCES expense_categories(id) ON DELETE SET NULL,
  category_name       TEXT,
  account_name        TEXT,
  amount              INTEGER NOT NULL,  -- fils
  description         TEXT NOT NULL,
  notes               TEXT,
  created_at          TEXT NOT NULL
);
INSERT INTO expenses_new (id, expense_number, expense_date, account_id, category_id, category_name, account_name, amount, description, notes, created_at)
SELECT id, expense_number, expense_date, account_id, category_id, NULL, NULL, amount, description, notes, created_at FROM expenses;
DROP TABLE expenses;
ALTER TABLE expenses_new RENAME TO expenses;

-- Rebuild topups (no changes to columns except adding names)
CREATE TABLE topups_new (
  id            TEXT PRIMARY KEY,
  topup_number  TEXT NOT NULL UNIQUE,
  topup_date    TEXT NOT NULL,
  account_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  account_name  TEXT,
  supplier_id   TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  amount        INTEGER NOT NULL,
  cost          INTEGER NOT NULL,
  profit        INTEGER NOT NULL,
  notes         TEXT,
  created_at    TEXT NOT NULL
);
INSERT INTO topups_new (id, topup_number, topup_date, account_id, account_name, supplier_id, supplier_name, amount, cost, profit, notes, created_at)
SELECT id, topup_number, topup_date, account_id, NULL, supplier_id, NULL, amount, cost, profit, notes, created_at FROM topups;
DROP TABLE topups;
ALTER TABLE topups_new RENAME TO topups;

-- Rebuild transfers
CREATE TABLE transfers_new (
  id               TEXT PRIMARY KEY,
  transfer_number  TEXT NOT NULL UNIQUE,
  transfer_date    TEXT NOT NULL,
  from_account_id  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  from_account_name TEXT,
  to_account_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_name  TEXT,
  amount           INTEGER NOT NULL,
  notes            TEXT,
  created_at       TEXT NOT NULL
);
INSERT INTO transfers_new (id, transfer_number, transfer_date, from_account_id, from_account_name, to_account_id, to_account_name, amount, notes, created_at)
SELECT id, transfer_number, transfer_date, from_account_id, NULL, to_account_id, NULL, amount, notes, created_at FROM transfers;
DROP TABLE transfers;
ALTER TABLE transfers_new RENAME TO transfers;

-- Rebuild ledger_entries
CREATE TABLE ledger_entries_new (
  id          TEXT PRIMARY KEY,
  entry_date  TEXT NOT NULL,
  account_id  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  account_name TEXT,
  type        TEXT NOT NULL CHECK(type IN ('debit','credit')),
  amount      INTEGER NOT NULL,
  ref_type    TEXT,
  ref_id      TEXT,
  description TEXT,
  created_at  TEXT NOT NULL
);
INSERT INTO ledger_entries_new (id, entry_date, account_id, account_name, type, amount, ref_type, ref_id, description, created_at)
SELECT id, entry_date, account_id, NULL, type, amount, ref_type, ref_id, description, created_at FROM ledger_entries;
DROP TABLE ledger_entries;
ALTER TABLE ledger_entries_new RENAME TO ledger_entries;
