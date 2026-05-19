CREATE TABLE IF NOT EXISTS audit_log (
  id      TEXT PRIMARY KEY,
  ts      TEXT NOT NULL,
  action  TEXT NOT NULL,
  detail  TEXT,
  ref_type TEXT,
  ref_id  TEXT
);
