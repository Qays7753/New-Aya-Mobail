import { dbClient } from '../client';
import { format } from 'date-fns';

export interface LedgerEntry {
  id: string;
  entry_date: string;
  account_id: string;
  account_name: string;
  type: 'debit' | 'credit';
  amount: number;
  ref_type: 'invoice' | 'expense' | 'purchase' | 'transfer' | 'manual';
  ref_id: string | null;
  description: string;
  created_at: string;
}

export async function getRecentLedgerEntries(limit = 100): Promise<LedgerEntry[]> {
  const query = `
    SELECT l.*, a.name as account_name 
    FROM ledger_entries l
    JOIN accounts a ON l.account_id = a.id
    ORDER BY l.created_at DESC
    LIMIT ?
  `;
  const results = await dbClient.query(query, [limit]);
  return results as LedgerEntry[];
}

export async function getDailySummary(dateString?: string) {
  const targetDate = dateString || format(new Date(), 'yyyy-MM-dd');

  // Total Sales (from invoices)
  const salesResult = await dbClient.query(`
    SELECT SUM(total_amount) as total_sales, SUM(paid_amount) as paid_sales
    FROM invoices 
    WHERE invoice_date = ?
  `, [targetDate]);

  // Total Expenses
  const expResult = await dbClient.query(`
    SELECT SUM(amount) as total_expenses
    FROM expenses 
    WHERE expense_date = ?
  `, [targetDate]);

  // Cash Movement (Credit vs Debit in ledger) for the day
  // To get actual "Cash in Hand" change today
  const ledgerResult = await dbClient.query(`
    SELECT type, SUM(amount) as total
    FROM ledger_entries
    WHERE entry_date = ?
    GROUP BY type
  `, [targetDate]);

  const sales = salesResult[0]?.total_sales || 0;
  const paidSales = salesResult[0]?.paid_sales || 0;
  const expenses = expResult[0]?.total_expenses || 0;
  
  let totalIn = 0;
  let totalOut = 0;
  
  for (const row of ledgerResult) {
    if (row.type === 'credit') totalIn += row.total;
    if (row.type === 'debit') totalOut += row.total;
  }

  return {
    date: targetDate,
    sales,
    paidSales,
    expenses,
    totalIn,
    totalOut,
    netProfit: sales - expenses // Simplistic profit
  };
}
