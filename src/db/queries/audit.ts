import { dbClient } from '../client';
import { nanoid } from 'nanoid';

export async function logAudit(
  action: string,
  detail?: string,
  refType?: string,
  refId?: string
): Promise<void> {
  try {
    await dbClient.run(
      `INSERT INTO audit_log (id, ts, action, detail, ref_type, ref_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nanoid(), new Date().toISOString(), action, detail ?? null, refType ?? null, refId ?? null]
    );
  } catch {
    // Audit failures must never block business operations
  }
}

export async function getAuditLog(limit = 200): Promise<{
  id: string; ts: string; action: string; detail: string | null;
  ref_type: string | null; ref_id: string | null;
}[]> {
  return dbClient.query(
    `SELECT id, ts, action, detail, ref_type, ref_id
     FROM audit_log ORDER BY ts DESC LIMIT ?`,
    [limit]
  );
}
