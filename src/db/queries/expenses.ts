import { dbClient } from '../client';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  account_id: string;
  expense_date: string;
  created_at: string;
}

export async function addExpense(data: {
  amount: number;
  category: string;
  description: string;
  accountId: string;
}) {
  const { amount, category, description, accountId } = data;
  
  const id = nanoid();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date().toISOString();
  
  const stmts: {sql: string, params: any[]}[] = [];
  
  // 1. Create expense record
  stmts.push({
    sql: `
      INSERT INTO expenses (id, amount, category, description, account_id, expense_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    params: [id, amount, category, description, accountId, today, now]
  });
  
  // 2. Remove from account
  stmts.push({
    sql: `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
    params: [amount, accountId]
  });
  
  // 3. Ledger entry
  stmts.push({
    sql: `
      INSERT INTO ledger_entries (id, entry_date, account_id, type, amount, ref_type, ref_id, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    params: [
      nanoid(), today, accountId, 'debit', amount, 'expense', id, 
      `مصروف (${category}): ${description}`, now
    ]
  });
  
  await dbClient.batchRun(stmts);
  return id;
}

export async function getRecentExpenses(limit = 50): Promise<Expense[]> {
  const query = `
    SELECT * FROM expenses 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  const results = await dbClient.query(query, [limit]);
  return results as Expense[];
}
