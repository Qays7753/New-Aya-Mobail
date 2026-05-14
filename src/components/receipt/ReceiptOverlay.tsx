import React from 'react';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { format } from 'date-fns';

interface ReceiptOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  storeName?: string;
}

export function ReceiptOverlay({ isOpen, onClose, invoice, storeName = 'متجرنا' }: ReceiptOverlayProps) {
  if (!isOpen || !invoice) return null;

  const formattedDate = format(new Date(invoice.created_at || new Date()), 'yyyy/MM/dd HH:mm');

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in slide-in-from-bottom-full overflow-y-auto" dir="rtl">
      <div className="sticky top-0 bg-white border-b border-border p-4 flex justify-between items-center z-10 shadow-sm">
        <h2 className="text-xl font-bold">إيصال الفاتورة</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full outline-none transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="w-full max-w-sm border-2 border-dashed border-border p-6 rounded-2xl bg-surface">
          <div className="text-center mb-6 border-b border-dashed border-border pb-6">
            <h1 className="text-2xl font-bold mb-2">{storeName}</h1>
            <div className="text-sm text-text-secondary space-y-1">
              <div>رقم الفاتورة: {invoice.invoice_number}</div>
              <div>التاريخ: {formattedDate}</div>
              {invoice.customer_name && <div>العميل: {invoice.customer_name}</div>}
              {invoice.customer_phone && <div>رقم العميل: {invoice.customer_phone}</div>}
            </div>
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashed border-border">
                    <th className="py-2 font-bold text-start">المنتج</th>
                    <th className="py-2 transform font-bold text-center">الكمية</th>
                    <th className="py-2 text-end font-bold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 text-start">{item.product_name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-end numeric">{formatMoney(item.subtotal || Math.round(item.unit_price * item.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-dashed border-border pt-4 text-sm space-y-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>الإجمالي:</span>
              <span className="numeric">{formatMoney(invoice.total_amount)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between items-center text-text-secondary">
                <span>الخصم:</span>
                <span className="numeric">{formatMoney(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>المدفوع:</span>
              <span className="numeric font-bold">{formatMoney(invoice.paid_amount)}</span>
            </div>
          </div>

          <div className="mt-8 text-center text-sm font-bold text-text-secondary border-t border-dashed border-border pt-6">
            شكراً لزيارتكم!
          </div>
        </div>
        
        <p className="text-text-secondary text-sm mt-6 mb-8 text-center max-w-sm">
          يمكنك تصوير هذه الشاشة لتوثيق الإيصال
        </p>
      </div>
    </div>
  );
}
