-- SB5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice  ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product  ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date          ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status        ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_inv   ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_acc   ON invoice_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date          ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_ledger_account         ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date            ON ledger_entries(entry_date);
