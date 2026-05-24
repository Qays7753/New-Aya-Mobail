PRAGMA user_version = 12;

-- device_id: identity of the writing tablet
ALTER TABLE invoices         ADD COLUMN device_id TEXT;
ALTER TABLE invoice_items    ADD COLUMN device_id TEXT;
ALTER TABLE invoice_payments ADD COLUMN device_id TEXT;
ALTER TABLE expenses         ADD COLUMN device_id TEXT;
ALTER TABLE topups           ADD COLUMN device_id TEXT;
ALTER TABLE transfers        ADD COLUMN device_id TEXT;
ALTER TABLE maintenance_jobs ADD COLUMN device_id TEXT;
ALTER TABLE ledger_entries   ADD COLUMN device_id TEXT;
ALTER TABLE audit_log        ADD COLUMN device_id TEXT;
ALTER TABLE inventory_counts ADD COLUMN device_id TEXT;
ALTER TABLE day_closures     ADD COLUMN device_id TEXT;

-- updated_at: ISO timestamp of last modification (only where missing)
-- products, customers, maintenance_jobs, categories already have updated_at
ALTER TABLE invoices         ADD COLUMN updated_at TEXT;
ALTER TABLE invoice_items    ADD COLUMN updated_at TEXT;
ALTER TABLE invoice_payments ADD COLUMN updated_at TEXT;
ALTER TABLE expenses         ADD COLUMN updated_at TEXT;
ALTER TABLE topups           ADD COLUMN updated_at TEXT;
ALTER TABLE transfers        ADD COLUMN updated_at TEXT;
ALTER TABLE ledger_entries   ADD COLUMN updated_at TEXT;
ALTER TABLE accounts         ADD COLUMN updated_at TEXT;

-- deleted_at: soft-delete timestamp (NULL = active)
ALTER TABLE products           ADD COLUMN deleted_at TEXT;
ALTER TABLE categories         ADD COLUMN deleted_at TEXT;
ALTER TABLE expense_categories ADD COLUMN deleted_at TEXT;
ALTER TABLE expenses           ADD COLUMN deleted_at TEXT;
ALTER TABLE maintenance_jobs   ADD COLUMN deleted_at TEXT;
ALTER TABLE accounts           ADD COLUMN deleted_at TEXT;

-- Sync-prep indexes
CREATE INDEX IF NOT EXISTS idx_invoices_device    ON invoices(device_id);
CREATE INDEX IF NOT EXISTS idx_invoices_updated   ON invoices(updated_at);
CREATE INDEX IF NOT EXISTS idx_expenses_device    ON expenses(device_id);
CREATE INDEX IF NOT EXISTS idx_ledger_device      ON ledger_entries(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_device       ON audit_log(device_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted   ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted_at);
