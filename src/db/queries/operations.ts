import { dbClient } from '../client';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';

export interface LedgerEntry {
  id: string;
  entry_date: string;
  account_id: string;
  account_name: string;
  type: 'debit' | 'credit';
  amount: number;
  ref_type: 'invoice' | 'expense' | 'topup' | 'transfer' | 'manual' | 'reconciliation' | 'maintenance';
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

export async function createTopup({
  account_id,
  supplier_id,
  amount,
  cost,
  profit,
  notes
}: {
  account_id: string;
  supplier_id?: string;
  amount: number;
  cost: number;
  profit: number;
  notes?: string;
}) {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');
  const timestamp = now.toISOString();

  let supplier_name: string | null = null;
  if (supplier_id) {
    const sResult = await dbClient.query("SELECT name FROM suppliers WHERE id = ?", [supplier_id]);
    if (sResult.length > 0) supplier_name = sResult[0].name;
  }

  let account_name: string | null = null;
  const aResult = await dbClient.query("SELECT name FROM accounts WHERE id = ?", [account_id]);
  if (aResult.length > 0) account_name = aResult[0].name;
  
  let nextVal = 1;
  const seqResult = await dbClient.query("SELECT last_val FROM sequences WHERE name = 'topup'");
  if (seqResult.length > 0) nextVal = seqResult[0].last_val + 1;
  
  const topupNumber = `TOP-${format(now, 'yyMM')}-${nextVal.toString().padStart(4, '0')}`;
  const topupId = nanoid();

  const tx = [
    {
      sql: "UPDATE sequences SET last_val = ? WHERE name = 'topup'",
      params: [nextVal]
    },
    {
      sql: `INSERT INTO topups (id, topup_number, topup_date, account_id, account_name, supplier_id, supplier_name, amount, cost, profit, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [topupId, topupNumber, dateStr, account_id, account_name, supplier_id || null, supplier_name, amount, cost, profit, notes || null, timestamp]
    },
    {
      sql: `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
      params: [cost, account_id]
    },
    {
      sql: `INSERT INTO ledger_entries (id, entry_date, account_id, account_name, type, amount, ref_type, ref_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [nanoid(), dateStr, account_id, account_name, 'credit', cost, 'topup', topupId, `شحن رصيد: ${topupNumber}`, timestamp]
    }
  ];

  await dbClient.batchRun(tx);
  return { id: topupId, topupNumber };
}

export async function createTransfer({
  from_account_id,
  to_account_id,
  amount,
  notes
}: {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  notes?: string;
}) {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');
  const timestamp = now.toISOString();

  let from_account_name: string | null = null;
  let to_account_name: string | null = null;
  const accountsResult = await dbClient.query("SELECT id, name FROM accounts WHERE id IN (?, ?)", [from_account_id, to_account_id]);
  accountsResult.forEach(a => {
    if (a.id === from_account_id) from_account_name = a.name;
    if (a.id === to_account_id) to_account_name = a.name;
  });

  let nextVal = 1;
  const seqResult = await dbClient.query("SELECT last_val FROM sequences WHERE name = 'transfer'");
  if (seqResult.length > 0) nextVal = seqResult[0].last_val + 1;
  
  const transferNumber = `TRF-${format(now, 'yyMM')}-${nextVal.toString().padStart(4, '0')}`;
  const transferId = nanoid();

  const tx = [
    {
      sql: "UPDATE sequences SET last_val = ? WHERE name = 'transfer'",
      params: [nextVal]
    },
    {
      sql: `INSERT INTO transfers (id, transfer_number, transfer_date, from_account_id, from_account_name, to_account_id, to_account_name, amount, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [transferId, transferNumber, dateStr, from_account_id, from_account_name, to_account_id, to_account_name, amount, notes || null, timestamp]
    },
    {
      sql: `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
      params: [amount, from_account_id]
    },
    {
      sql: `INSERT INTO ledger_entries (id, entry_date, account_id, account_name, type, amount, ref_type, ref_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [nanoid(), dateStr, from_account_id, from_account_name, 'debit', amount, 'transfer', transferId, `تحويل صادر: ${transferNumber}`, timestamp]
    },
    {
      sql: `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
      params: [amount, to_account_id]
    },
    {
      sql: `INSERT INTO ledger_entries (id, entry_date, account_id, account_name, type, amount, ref_type, ref_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [nanoid(), dateStr, to_account_id, to_account_name, 'credit', amount, 'transfer', transferId, `تحويل وارد: ${transferNumber}`, timestamp]
    }
  ];

  await dbClient.batchRun(tx);
  return { id: transferId, transferNumber };
}

