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
  payments: { accountId: string; amount: number }[];
}) {
  const { cartItems, subtotal, totalDiscount, totalAmount, payments } = data;
  
  const invoiceId = nanoid();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date().toISOString();
  
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  // Prepare a batch of SQL statements for the transaction
  const stmts: {sql: string, params: any[]}[] = [];
  
  // 1. Get next invoice number
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
      INSERT INTO invoices (id, invoice_number, invoice_date, subtotal, discount_amount, total_amount, paid_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    params: [invoiceId, invoiceNumber, today, subtotal, totalDiscount, totalAmount, paidAmount, now]
  });
  
  // 3. Create items and update stock
  for (const item of cartItems) {
    const itemId = nanoid();
    
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
  
  // 4. Create payments and update account ledger
  for (const payment of payments) {
    if (payment.amount <= 0) continue;
    
    const paymentId = nanoid();
    stmts.push({
      sql: `INSERT INTO invoice_payments (id, invoice_id, account_id, amount) VALUES (?, ?, ?, ?)`,
      params: [paymentId, invoiceId, payment.accountId, payment.amount]
    });
    
    stmts.push({
      sql: `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
      params: [payment.amount, payment.accountId]
    });
    
    stmts.push({
      sql: `
        INSERT INTO ledger_entries (id, entry_date, account_id, type, amount, ref_type, ref_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [nanoid(), today, payment.accountId, 'credit', payment.amount, 'invoice', invoiceId, `مبيعات فاتورة رقم ${invoiceNumber}`, now]
    });
  }
  
  await dbClient.batchRun(stmts);
  return { invoiceId, invoiceNumber };
}

export async function getInvoiceWithItems(invoiceId: string) {
  const invoices = await dbClient.query(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]);
  if (!invoices.length) return null;
  const invoice = invoices[0];
  const items = await dbClient.query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);
  return { ...invoice, items };
}

export async function getRecentInvoices(limit = 100) {
  const query = `
    SELECT * 
    FROM invoices 
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const invoices = await dbClient.query(query, [limit]);
  return invoices;
}

export async function returnInvoice(invoiceId: string, refunds: { accountId: string; amount: number }[]) {
  const invoiceResult = await dbClient.query(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]);
  if (invoiceResult.length === 0) throw new Error("Invoice not found");
  
  const invoice = invoiceResult[0];
  if (invoice.status === 'returned') throw new Error("Invoice already returned");

  const items = await dbClient.query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);
  
  const stmts: {sql: string, params: any[]}[] = [];
  const now = new Date().toISOString();
  const today = format(new Date(), 'yyyy-MM-dd');

  stmts.push({
    sql: `UPDATE invoices SET status = 'returned', notes = 'تم الاسترجاع', paid_amount = paid_amount - ? WHERE id = ?`,
    params: [refunds.reduce((sum, r) => sum + r.amount, 0), invoiceId]
  });

  for (const item of items) {
    if (!item.product_id) continue;
    stmts.push({
      sql: `UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ? AND track_stock = 1`,
      params: [item.quantity, now, item.product_id]
    });
  }

  for (const refund of refunds) {
    if (refund.amount <= 0) continue;
    
    stmts.push({
      sql: `INSERT INTO invoice_payments (id, invoice_id, account_id, amount) VALUES (?, ?, ?, ?)`,
      params: [nanoid(), invoiceId, refund.accountId, -refund.amount]
    });

    stmts.push({
      sql: `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
      params: [refund.amount, refund.accountId]
    });
    
    stmts.push({
      sql: `
        INSERT INTO ledger_entries (id, entry_date, account_id, type, amount, ref_type, ref_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [nanoid(), today, refund.accountId, 'debit', refund.amount, 'invoice', invoiceId, `استرجاع مبيعات فاتورة رقم ${invoice.invoice_number}`, now]
    });
  }

  await dbClient.batchRun(stmts);
}
