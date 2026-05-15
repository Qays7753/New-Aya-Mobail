import { dbClient } from '../client';
import { nanoid } from 'nanoid';

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: 'device' | 'sim' | 'service_general' | 'service_repair' | 'accessory' | 'package';
  sale_price: number;
  stock_qty: number;
  min_stock: number;
  track_stock: boolean;
  is_quick_add: boolean;
  is_active: boolean;
  notes: string | null;
  image_path?: string | null;
  icon?: string;
}

export async function getActiveProducts(search?: string, category?: string): Promise<Product[]> {
  let query = `SELECT * FROM products WHERE is_active = 1`;
  const params: any[] = [];
  
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  if (search) {
    query += ` AND (name LIKE ? OR sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY is_quick_add DESC, name ASC;`;
  
  const results = await dbClient.query(query, params);
  
  return results.map(row => ({
    ...row,
    track_stock: Boolean(row.track_stock),
    is_quick_add: Boolean(row.is_quick_add),
    is_active: Boolean(row.is_active)
  }));
}

export async function getAllProducts(search?: string, category?: string, showInactive = false): Promise<Product[]> {
  let query = `SELECT * FROM products WHERE 1=1`;
  const params: any[] = [];
  
  if (!showInactive) {
    query += ` AND is_active = 1`;
  }
  
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  if (search) {
    query += ` AND (name LIKE ? OR sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY name ASC;`;
  
  const results = await dbClient.query(query, params);
  
  return results.map(row => ({
    ...row,
    track_stock: Boolean(row.track_stock),
    is_quick_add: Boolean(row.is_quick_add),
    is_active: Boolean(row.is_active)
  }));
}

export async function addProduct(data: Omit<Product, 'id' | 'is_active'>) {
  const id = nanoid();
  const now = new Date().toISOString();
  
  try {
    await dbClient.run(
      `INSERT INTO products (id, name, sku, category, sale_price, stock_qty, min_stock, track_stock, is_quick_add, is_active, notes, image_path, icon, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      [
        id, data.name, data.sku || null, data.category, data.sale_price, 
        data.stock_qty, data.min_stock, data.track_stock ? 1 : 0, 
        data.is_quick_add ? 1 : 0, data.notes || null, data.image_path || null, data.icon || 'Box', now, now
      ]
    );
    return id;
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed: products.sku')) {
      throw new Error('رمز الباركود (SKU) مستخدم مسبقاً لصنف آخر');
    }
    throw err;
  }
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id'>>) {
  const now = new Date().toISOString();
  const updates: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      if (typeof value === 'boolean') {
        params.push(value ? 1 : 0);
      } else {
        params.push(value);
      }
    }
  }

  if (updates.length === 0) return;

  updates.push(`updated_at = ?`);
  params.push(now);
  params.push(id);

  try {
    await dbClient.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed: products.sku')) {
      throw new Error('رمز الباركود (SKU) مستخدم مسبقاً لصنف آخر');
    }
    throw err;
  }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await dbClient.run(
    `UPDATE products SET is_active = ?, updated_at = ? WHERE id = ?`,
    [isActive ? 1 : 0, new Date().toISOString(), id]
  );
}

// Temporary seed function for development
export async function seedProductsIfEmpty() {
  const count = await dbClient.query('SELECT COUNT(*) as count FROM products');
  if (count[0].count === 0) {
    const stmts = [
      {
        sql: `INSERT INTO products (id, name, sku, category, sale_price, stock_qty, min_stock, track_stock, is_quick_add, is_active, created_at, updated_at) 
              VALUES ('1', 'شاحن أيفون أصلي', 'APL-CHG', 'accessory', 15000, 50, 5, 1, 1, 1, datetime('now'), datetime('now'))`
      },
      {
        sql: `INSERT INTO products (id, name, sku, category, sale_price, stock_qty, min_stock, track_stock, is_quick_add, is_active, created_at, updated_at) 
              VALUES ('2', 'حماية شاشة أيفون 13', 'SCR-IP13', 'accessory', 5000, 100, 10, 1, 1, 1, datetime('now'), datetime('now'))`
      },
      {
        sql: `INSERT INTO products (id, name, sku, category, sale_price, stock_qty, min_stock, track_stock, is_quick_add, is_active, created_at, updated_at) 
              VALUES ('3', 'خدمة فورمات وتنظيف', 'SRV-FMT', 'service_general', 10000, 0, 0, 0, 0, 1, datetime('now'), datetime('now'))`
      },
      {
        sql: `INSERT INTO products (id, name, sku, category, sale_price, stock_qty, min_stock, track_stock, is_quick_add, is_active, created_at, updated_at) 
              VALUES ('4', 'شريحة اتصال انترنت', 'SIM-NET', 'sim', 3000, 20, 5, 1, 0, 1, datetime('now'), datetime('now'))`
      }
    ];

    // Also seed a default un-deletable Cash Account if no accounts exist
    const accCount = await dbClient.query('SELECT COUNT(*) as count FROM accounts');
    if (accCount[0].count === 0) {
      stmts.push({
        sql: `INSERT INTO accounts (id, name, type, balance, fee_percent, is_active, sort_order, created_at)
              VALUES ('acc-cash-1', 'الصندوق المالي (نقد)', 'cash', 0, 0, 1, 1, datetime('now'))`
      });
      stmts.push({
        sql: `INSERT INTO accounts (id, name, type, balance, fee_percent, is_active, sort_order, created_at)
              VALUES ('acc-bank-1', 'حساب بنكي', 'bank', 0, 0, 1, 2, datetime('now'))`
      });
    }

    await dbClient.batchRun(stmts);
  }
}
