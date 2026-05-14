import { dbClient } from '../client';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';

export async function createInventoryCount(items: { product_id: string; system_qty: number; actual_qty: number; reason: string }[], notes?: string) {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd HH:mm:ss');
  const countId = nanoid();

  const tx: {sql: string, params: any[]}[] = [
    {
      sql: `INSERT INTO inventory_counts (id, count_date, status, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      params: [countId, dateStr, 'completed', notes || null, dateStr]
    }
  ];

  for (const item of items) {
    tx.push({
      sql: `INSERT INTO inventory_count_items (id, inventory_count_id, product_id, system_qty, actual_qty, reason)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [nanoid(), countId, item.product_id, item.system_qty, item.actual_qty, item.reason || null]
    });

    // Update actual stock
    tx.push({
      sql: `UPDATE products SET stock_qty = ? WHERE id = ?`,
      params: [item.actual_qty.toString(), item.product_id]
    });
  }

  await dbClient.batchRun(tx);
  return countId;
}

export async function getInventoryCounts() {
  const counts = await dbClient.query(`
    SELECT * FROM inventory_counts ORDER BY created_at DESC
  `);
  
  const result = [];
  for (const c of counts) {
    const items = await dbClient.query(`
      SELECT i.*, p.name as product_name 
      FROM inventory_count_items i
      JOIN products p ON i.product_id = p.id
      WHERE i.inventory_count_id = ?
    `, [c.id]);
    result.push({ ...c, items });
  }
  return result;
}

export async function createAccountReconciliation(account_id: string, actual_balance: number) {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');
  const timestamp = now.toISOString();

  // Get current balance
  const accountResult = await dbClient.query(`SELECT balance FROM accounts WHERE id = ?`, [account_id]);
  if (!accountResult.length) throw new Error('Account not found');
  const system_balance = accountResult[0].balance;
  
  const diff = actual_balance - system_balance;

  if (diff === 0) return;

  const type = diff > 0 ? 'credit' : 'debit';
  const amount = Math.abs(diff);

  const tx = [
    {
      sql: `UPDATE accounts SET balance = ? WHERE id = ?`,
      params: [actual_balance.toString(), account_id]
    },
    {
      sql: `INSERT INTO ledger_entries (id, entry_date, account_id, type, amount, ref_type, ref_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [nanoid(), dateStr, account_id, type, amount, 'reconciliation', null, 'تسوية حساب: تعديل الرصيد الفعلي', timestamp]
    }
  ];

  await dbClient.batchRun(tx);
}
