import { dbClient } from '../client';
import { nanoid } from 'nanoid';
import { generateSequenceNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { useCartStore } from '@/stores/cart.store';

export async function completeSale(data: {
  cartItems: ReturnType<typeof useCartStore.getState>['items'];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  paidAmount: number;
  accountId: string;
}) {
  const { cartItems, subtotal, totalDiscount, totalAmount, paidAmount, accountId } = data;
  
  const invoiceId = nanoid();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date().toISOString();
  
  // Prepare a batch of SQL statements for the transaction
  const stmts: {sql: string, params: any[]}[] = [];
  
  // 1. Get next invoice number
  // For safety in raw sqlite we can do this in the app logic, but ideally we increment sequences inside the transaction.
  // SQLite doesn't easily let us read the RETURNING value in our batchRun wrapper without custom logic.
  // So we'll fetch sequence first, then update it. This is offline single user, so race conditions are minor.
  const seqResult = await dbClient.query("SELECT last_val FROM sequences WHERE name = 'invoice'");
  let nextVal = 1;
  if (seqResult.length > 0) {
    nextVal = seqResult[0].last_val + 1;
  }
  
  const invoiceNumber = generateSequenceNumber('INV', nextVal - 1, 6);
  
  stmts.push({
    sql: "UPDATE sequences SET last_val = ? WHERE name = 'invoice'",
    params: [nextVal]
  });
  
  // 2. Create invoice
  stmts.push({
    sql: `
      INSERT INTO invoices (id, invoice_number, invoice_date, subtotal, discount_amount, total_amount, paid_amount, debt_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    params: [invoiceId, invoiceNumber, today, subtotal, totalDiscount, totalAmount, paidAmount, totalAmount - paidAmount, now]
  });
  
  // 3. Create items and update stock
  for (const item of cartItems) {
    const itemId = nanoid();
    
    // Simplistic discount logic for DB: just using store provided values. 
    // Usually line_total is subtotal - discount_amount
    const unitPrice = item.product.sale_price;
    const sub = unitPrice * item.quantity;
    let dAmt = 0;
    if (item.discountType === 'amount') dAmt = item.discountValue;
    else dAmt = Math.round((sub * item.discountValue) / 100);
    if (dAmt > sub) dAmt = sub;
    const lineTotal = sub - dAmt;
    
    stmts.push({
      sql: `
        INSERT INTO invoice_items (id, invoice_id, product_id, product_name, quantity, unit_price, discount_amount, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [itemId, invoiceId, item.product.id, item.product.name, item.quantity, unitPrice, dAmt, lineTotal]
    });
    
    if (item.product.track_stock) {
      stmts.push({
        sql: `UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?`,
        params: [item.quantity, now, item.product.id]
      });
    }
  }
  
  // 4. Create payment and update account ledger
  if (paidAmount > 0) {
    const paymentId = nanoid();
    stmts.push({
      sql: `INSERT INTO invoice_payments (id, invoice_id, account_id, amount) VALUES (?, ?, ?, ?)`,
      params: [paymentId, invoiceId, accountId, paidAmount]
    });
    
    stmts.push({
      sql: `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
      params: [paidAmount, accountId]
    });
    
    stmts.push({
      sql: `
        INSERT INTO ledger_entries (id, entry_date, account_id, type, amount, ref_type, ref_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [nanoid(), today, accountId, 'credit', paidAmount, 'invoice', invoiceId, `مبيعات فاتورة رقم ${invoiceNumber}`, now]
    });
  }
  
  await dbClient.batchRun(stmts);
  return { invoiceId, invoiceNumber };
}
