import { dbClient } from '../client';

export interface DiscountLine {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  per_unit_discount: number;
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  invoice_status: string;
}

export interface GiftLine {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  gift_value_total: number;
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  invoice_status: string;
}

export interface DiscountGiftSummary {
  totalCount: number;
  totalAmount: number;
  distinctProducts: number;
  distinctInvoices: number;
}

export async function getDiscountedLines(fromDate: string, toDate: string): Promise<DiscountLine[]> {
  return dbClient.query(
    `SELECT
       ii.id,
       ii.product_id,
       ii.product_name,
       ii.quantity,
       ii.unit_price,
       ii.discount_amount,
       ii.line_total,
       (CASE WHEN ii.quantity > 0 THEN CAST(ii.discount_amount AS REAL) / ii.quantity ELSE 0 END) AS per_unit_discount,
       i.id            AS invoice_id,
       i.invoice_number,
       i.invoice_date,
       i.status        AS invoice_status
     FROM invoice_items ii
     JOIN invoices i ON ii.invoice_id = i.id
     WHERE ii.discount_amount > 0
       AND ii.is_gift = 0
       AND i.status IN ('active','partially_returned')
       AND i.invoice_date BETWEEN ? AND ?
     ORDER BY i.invoice_date DESC, i.invoice_number DESC`,
    [fromDate, toDate]
  );
}

export async function getGiftLines(fromDate: string, toDate: string): Promise<GiftLine[]> {
  return dbClient.query(
    `SELECT
       ii.id,
       ii.product_id,
       ii.product_name,
       ii.quantity,
       ii.unit_price,
       (ii.unit_price * ii.quantity) AS gift_value_total,
       i.id            AS invoice_id,
       i.invoice_number,
       i.invoice_date,
       i.status        AS invoice_status
     FROM invoice_items ii
     JOIN invoices i ON ii.invoice_id = i.id
     WHERE ii.is_gift = 1
       AND i.status IN ('active','partially_returned')
       AND i.invoice_date BETWEEN ? AND ?
     ORDER BY i.invoice_date DESC, i.invoice_number DESC`,
    [fromDate, toDate]
  );
}

export async function getDiscountSummary(fromDate: string, toDate: string): Promise<DiscountGiftSummary> {
  const [row] = await dbClient.query(
    `SELECT
       COUNT(*)                              AS totalCount,
       COALESCE(SUM(ii.discount_amount), 0) AS totalAmount,
       COUNT(DISTINCT ii.product_id)        AS distinctProducts,
       COUNT(DISTINCT ii.invoice_id)        AS distinctInvoices
     FROM invoice_items ii
     JOIN invoices i ON ii.invoice_id = i.id
     WHERE ii.discount_amount > 0
       AND ii.is_gift = 0
       AND i.status IN ('active','partially_returned')
       AND i.invoice_date BETWEEN ? AND ?`,
    [fromDate, toDate]
  );
  return {
    totalCount:       Number(row?.totalCount       ?? 0),
    totalAmount:      Number(row?.totalAmount      ?? 0),
    distinctProducts: Number(row?.distinctProducts ?? 0),
    distinctInvoices: Number(row?.distinctInvoices ?? 0),
  };
}

export async function getGiftSummary(fromDate: string, toDate: string): Promise<DiscountGiftSummary> {
  const [row] = await dbClient.query(
    `SELECT
       COUNT(*)                                       AS totalCount,
       COALESCE(SUM(ii.unit_price * ii.quantity), 0) AS totalAmount,
       COUNT(DISTINCT ii.product_id)                 AS distinctProducts,
       COUNT(DISTINCT ii.invoice_id)                 AS distinctInvoices
     FROM invoice_items ii
     JOIN invoices i ON ii.invoice_id = i.id
     WHERE ii.is_gift = 1
       AND i.status IN ('active','partially_returned')
       AND i.invoice_date BETWEEN ? AND ?`,
    [fromDate, toDate]
  );
  return {
    totalCount:       Number(row?.totalCount       ?? 0),
    totalAmount:      Number(row?.totalAmount      ?? 0),
    distinctProducts: Number(row?.distinctProducts ?? 0),
    distinctInvoices: Number(row?.distinctInvoices ?? 0),
  };
}
