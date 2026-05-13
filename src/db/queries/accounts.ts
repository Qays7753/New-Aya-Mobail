import { dbClient } from '../client';

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  fee_percent: number;
  module_scope: string | null;
  is_active: boolean;
}

export async function getActiveAccounts(): Promise<Account[]> {
  const query = `SELECT * FROM accounts WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`;
  const results = await dbClient.query(query);
  return results.map(row => ({
    ...row,
    is_active: Boolean(row.is_active)
  }));
}
