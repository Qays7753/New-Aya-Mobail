import { dbClient } from '../client';
import { nanoid } from 'nanoid';
import { generateSequenceNumber } from '@/lib/utils';
import { format } from 'date-fns';

export interface MaintenanceJob {
  id: string;
  job_number: string;
  customer_name: string;
  customer_phone: string | null;
  device_model: string;
  issue_description: string;
  expected_cost: number | null;
  status: 'received' | 'in_progress' | 'completed' | 'delivered';
  received_at: string;
  completed_at: string | null;
  delivered_at: string | null;
  notes: string | null;
}

export async function getJobs(status?: string): Promise<MaintenanceJob[]> {
  let query = 'SELECT * FROM maintenance_jobs';
  const params: any[] = [];
  
  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY received_at DESC';
  
  const results = await dbClient.query(query, params);
  return results as MaintenanceJob[];
}

export async function addJob(data: {
  customer_name: string;
  customer_phone: string;
  device_model: string;
  issue_description: string;
  expected_cost: number;
  notes: string;
}) {
  const id = nanoid();
  const now = new Date().toISOString();
  // Get sequence
  const seqResult = await dbClient.query("SELECT last_val FROM sequences WHERE name = 'maintenance'");
  let nextVal = 1;
  if (seqResult.length > 0) nextVal = seqResult[0].last_val + 1;
  
  const jobNumber = generateSequenceNumber('REP', nextVal - 1, 5);
  
  const stmts: {sql: string, params: any[]}[] = [];
  stmts.push({
    sql: "UPDATE sequences SET last_val = ? WHERE name = 'maintenance'",
    params: [nextVal]
  });
  
  stmts.push({
    sql: `
      INSERT INTO maintenance_jobs 
      (id, job_number, customer_name, customer_phone, device_model, issue_description, expected_cost, status, received_at, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?)
    `,
    params: [
      id, jobNumber, data.customer_name, data.customer_phone || null, 
      data.device_model, data.issue_description, data.expected_cost, 
      now, data.notes || null, now
    ]
  });
  
  await dbClient.batchRun(stmts);
  return id;
}

export async function updateJobStatus(id: string, status: MaintenanceJob['status']) {
  const now = new Date().toISOString();
  let query = `UPDATE maintenance_jobs SET status = ?`;
  const params: any[] = [status];
  
  if (status === 'completed') {
    query += `, completed_at = ?`;
    params.push(now);
  } else if (status === 'delivered') {
    query += `, delivered_at = ?`;
    params.push(now);
  }
  
  query += ` WHERE id = ?`;
  params.push(id);
  
  await dbClient.run(query, params);
}
