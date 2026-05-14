-- 004_products_media.sql
PRAGMA user_version = 4;

ALTER TABLE products ADD COLUMN image_path TEXT;
ALTER TABLE products ADD COLUMN icon TEXT DEFAULT 'Box';
