import { dbClient } from '../client';
import { nanoid } from 'nanoid';
import { generateSequenceNumber } from '@/lib/utils';
import { format } from 'date-fns';

export interface PurchaseItem {
  productId: string;
  quantity: number;
  costPrice: number;
}

export async function restockProducts(data: {
  items: PurchaseItem[];
  supplierName: string;
  totalCost: number;
  paidAmount: number;
  accountId: string;
}) {
  const { items, supplierName, totalCost, paidAmount, accountId } = data;
  
  const invoiceId = nanoid();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date().toISOString();
  
  const stmts: {sql: string, params: any[]}[] = [];
  
  // Create an informal purchase record (or restock log)
  // For simplicity, we just log it as a ledger entry and update stock.
  // In a full system, you would have purchase_invoices and purchase_items.
  
  // 1. Update stock quantities and calculate total actual restock value
  for (const item of items) {
    if (item.quantity > 0) {
      stmts.push({
        sql: `UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?`,
        params: [item.quantity, now, item.productId]
      });
      // Optionally update product cost_price here if we were storing it
    }
  }

  // 2. Handle finance (Expense / Payment)
  if (paidAmount > 0) {
    // Deduct from account
    stmts.push({
      sql: `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
      params: [paidAmount, accountId]
    });
    
    // Add ledger entry for purchase
    stmts.push({
      sql: `
        INSERT INTO ledger_entries (id, entry_date, account_id, type, amount, ref_type, ref_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        nanoid(), today, accountId, 'debit', paidAmount, 'purchase', invoiceId, 
        `فاتورة مشتريات (مورد: ${supplierName || 'غير محدد'})`, now
      ]
    });
  }

  if (stmts.length > 0) {
    await dbClient.batchRun(stmts);
  }
}
