import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDiscountedLines,
  getGiftLines,
  getDiscountSummary,
  getGiftSummary,
  type DiscountLine,
  type GiftLine,
} from '@/db/queries/monitoring';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Download, Tag, Gift, FileText, Package, Receipt } from 'lucide-react';

const PAGE_SIZE = 50;

function escapeCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(rows: (string | number)[][], filename: string) {
  const content = rows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function KpiCard({ icon: Icon, label, value, color = 'text-text-primary' }: {
  icon: React.ElementType; label: string; value: string; color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
        <Icon className="w-4 h-4 shrink-0" />
        <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{label}</span>
      </div>
      <div className={cn('text-2xl font-bold numeric', color)} style={{ fontFamily: 'Inter, sans-serif' }}>
        {value}
      </div>
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-3 border-t border-border" dir="ltr">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 text-sm rounded-lg border border-border disabled:opacity-40 hover:border-accent transition-colors"
      >
        ‹
      </button>
      <span className="text-sm text-text-secondary" style={{ fontFamily: 'Tajawal, sans-serif' }}>
        {page} / {pages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-1 text-sm rounded-lg border border-border disabled:opacity-40 hover:border-accent transition-colors"
      >
        ›
      </button>
    </div>
  );
}

interface Props {
  from: string;
  to: string;
}

export function DiscountsGiftsTab({ from, to }: Props) {
  const [discountPage, setDiscountPage] = useState(1);
  const [giftPage, setGiftPage] = useState(1);

  const { data: discountLines = [], isLoading: dlLoading } = useQuery({
    queryKey: ['discountLines', from, to],
    queryFn: () => getDiscountedLines(from, to),
  });

  const { data: giftLines = [], isLoading: glLoading } = useQuery({
    queryKey: ['giftLines', from, to],
    queryFn: () => getGiftLines(from, to),
  });

  const { data: discountSummary } = useQuery({
    queryKey: ['discountSummary', from, to],
    queryFn: () => getDiscountSummary(from, to),
  });

  const { data: giftSummary } = useQuery({
    queryKey: ['giftSummary', from, to],
    queryFn: () => getGiftSummary(from, to),
  });

  const pagedDiscounts: DiscountLine[] = discountLines.slice(
    (discountPage - 1) * PAGE_SIZE,
    discountPage * PAGE_SIZE
  );
  const pagedGifts: GiftLine[] = giftLines.slice(
    (giftPage - 1) * PAGE_SIZE,
    giftPage * PAGE_SIZE
  );

  const handleExportDiscounts = () => {
    const header = ['التاريخ', 'رقم الفاتورة', 'المنتج', 'الكمية', 'السعر', 'الخصم/الوحدة', 'إجمالي الخصم', 'السطر بعد الخصم'];
    const rows = discountLines.map((r: DiscountLine) => [
      r.invoice_date,
      r.invoice_number,
      r.product_name,
      r.quantity,
      (r.unit_price / 100).toFixed(3),
      (r.per_unit_discount / 100).toFixed(3),
      (r.discount_amount / 100).toFixed(3),
      (r.line_total / 100).toFixed(3),
    ]);
    downloadCsv([header, ...rows], `خصومات_${from}_${to}.csv`);
  };

  const handleExportGifts = () => {
    const header = ['التاريخ', 'رقم الفاتورة', 'المنتج', 'الكمية', 'السعر', 'قيمة الهدية الإجمالية'];
    const rows = giftLines.map((r: GiftLine) => [
      r.invoice_date,
      r.invoice_number,
      r.product_name,
      r.quantity,
      (r.unit_price / 100).toFixed(3),
      (r.gift_value_total / 100).toFixed(3),
    ]);
    downloadCsv([header, ...rows], `هدايا_${from}_${to}.csv`);
  };

  const loading = dlLoading || glLoading;

  if (loading) {
    return (
      <div className="p-16 flex justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* ══ DISCOUNTS SECTION ══════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الخصومات
            </h2>
            <span className="text-sm text-text-secondary" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ({discountLines.length} سطر)
            </span>
          </div>
          <button
            onClick={handleExportDiscounts}
            disabled={discountLines.length === 0}
            className="h-8 px-3 bg-success text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <Download className="w-3.5 h-3.5" />
            تصدير CSV
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={FileText}
            label="عدد الأسطر"
            value={String(discountSummary?.totalCount ?? 0)}
            color="text-accent"
          />
          <KpiCard
            icon={Tag}
            label="إجمالي الخصم"
            value={formatMoney(discountSummary?.totalAmount ?? 0)}
            color="text-danger"
          />
          <KpiCard
            icon={Package}
            label="عدد المنتجات"
            value={String(discountSummary?.distinctProducts ?? 0)}
          />
          <KpiCard
            icon={Receipt}
            label="عدد الفواتير"
            value={String(discountSummary?.distinctInvoices ?? 0)}
          />
        </div>

        {/* Discounts table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                  <th className="px-4 py-3 text-start" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الفاتورة</th>
                  <th className="px-4 py-3 text-start" style={{ fontFamily: 'Tajawal, sans-serif' }}>المنتج</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم/الوحدة</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الخصم</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>السطر بعد الخصم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedDiscounts.map(row => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 numeric text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{row.invoice_date}</td>
                    <td className="px-4 py-3 font-medium numeric text-accent" style={{ fontFamily: 'Inter, sans-serif' }}>{row.invoice_number}</td>
                    <td className="px-4 py-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>{row.product_name}</td>
                    <td className="px-4 py-3 text-end numeric font-bold">{row.quantity}</td>
                    <td className="px-4 py-3 text-end numeric tabular-nums">{formatMoney(row.unit_price)}</td>
                    <td className="px-4 py-3 text-end numeric tabular-nums text-danger">{formatMoney(Math.round(row.per_unit_discount))}</td>
                    <td className="px-4 py-3 text-end numeric tabular-nums font-bold text-danger">{formatMoney(row.discount_amount)}</td>
                    <td className="px-4 py-3 text-end numeric tabular-nums font-bold">{formatMoney(row.line_total)}</td>
                  </tr>
                ))}
                {discountLines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-text-secondary" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      لا توجد خصومات في الفترة المختارة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={discountPage} total={discountLines.length} onChange={setDiscountPage} />
        </div>
      </div>

      {/* ══ GIFTS SECTION ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الهدايا
            </h2>
            <span className="text-sm text-text-secondary" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ({giftLines.length} سطر)
            </span>
          </div>
          <button
            onClick={handleExportGifts}
            disabled={giftLines.length === 0}
            className="h-8 px-3 bg-success text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <Download className="w-3.5 h-3.5" />
            تصدير CSV
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={FileText}
            label="عدد الأسطر"
            value={String(giftSummary?.totalCount ?? 0)}
            color="text-accent"
          />
          <KpiCard
            icon={Gift}
            label="إجمالي قيمة الهدايا"
            value={formatMoney(giftSummary?.totalAmount ?? 0)}
            color="text-warning"
          />
          <KpiCard
            icon={Package}
            label="عدد المنتجات"
            value={String(giftSummary?.distinctProducts ?? 0)}
          />
          <KpiCard
            icon={Receipt}
            label="عدد الفواتير"
            value={String(giftSummary?.distinctInvoices ?? 0)}
          />
        </div>

        {/* Gifts table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                  <th className="px-4 py-3 text-start" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الفاتورة</th>
                  <th className="px-4 py-3 text-start" style={{ fontFamily: 'Tajawal, sans-serif' }}>المنتج</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر</th>
                  <th className="px-4 py-3 text-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>قيمة الهدية الإجمالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedGifts.map(row => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 numeric text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{row.invoice_date}</td>
                    <td className="px-4 py-3 font-medium numeric text-accent" style={{ fontFamily: 'Inter, sans-serif' }}>{row.invoice_number}</td>
                    <td className="px-4 py-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>{row.product_name}</td>
                    <td className="px-4 py-3 text-end numeric font-bold">{row.quantity}</td>
                    <td className="px-4 py-3 text-end numeric tabular-nums">{formatMoney(row.unit_price)}</td>
                    <td className="px-4 py-3 text-end numeric tabular-nums font-bold text-warning">{formatMoney(row.gift_value_total)}</td>
                  </tr>
                ))}
                {giftLines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-text-secondary" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      لا توجد هدايا في الفترة المختارة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={giftPage} total={giftLines.length} onChange={setGiftPage} />
        </div>
      </div>
    </div>
  );
}
