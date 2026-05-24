PRAGMA user_version = 10;

CREATE TABLE IF NOT EXISTS day_closures (
  closure_date     TEXT PRIMARY KEY,
  closed_at        TEXT NOT NULL,
  closed_by        TEXT,
  sales_total      INTEGER NOT NULL DEFAULT 0,
  cogs_total       INTEGER NOT NULL DEFAULT 0,
  discounts_total  INTEGER NOT NULL DEFAULT 0,
  gifts_value      INTEGER NOT NULL DEFAULT 0,
  returns_total    INTEGER NOT NULL DEFAULT 0,
  expenses_total   INTEGER NOT NULL DEFAULT 0,
  net_profit       INTEGER NOT NULL DEFAULT 0,
  notes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_day_closures_date ON day_closures(closure_date);
