import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveAccounts, Account } from '@/db/queries/accounts';
import { completeSale, getInvoiceWithItems } from '@/db/queries/sales';
import { formatMoney, parseMoney, subMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { X, CheckCircle, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoiceId: string, invoiceNumber: string, change: number) => void;
}

interface PaymentRow {
  id: string;
  accountId: string;
  amountInput: string;
}

export function PaymentDialog({ isOpen, onClose, onSuccess }: PaymentDialogProps) {
  const { items, getSubtotal, getTotalDiscount, getTotal, clearCart } = useCartStore();
  const total = getTotal();
  
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');

  const { data: accounts = [] } = useQuery({
    queryKey: ['active-accounts'],
    queryFn: getActiveAccounts,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      if (accounts.length > 0) {
        setPayments([{ 
          id: nanoid(), 
          accountId: accounts[0].id, 
          amountInput: (total / 100).toString() 
        }]);
      } else {
        setPayments([]);
      }
      setCashReceivedInput('');
    }
  }, [isOpen, total, accounts]);

  const parsedPayments = payments.map(p => ({
    accountId: p.accountId,
    amount: parseMoney(p.amountInput || '0')
  }));
  
  const totalApplied = parsedPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - totalApplied;
  const isExactMatch = totalApplied === total;
  
  const cashAccountsIds = accounts.filter(a => a.type === 'cash').map(a => a.id);
  const cashIncluded = parsedPayments.some(p => cashAccountsIds.includes(p.accountId));
  
  let change = 0;
  if (cashIncluded) {
    const received = parseMoney(cashReceivedInput || '0');
    const totalCashNeeded = parsedPayments
      .filter(p => cashAccountsIds.includes(p.accountId))
      .reduce((s, p) => s + p.amount, 0);
      
    if (received >= totalCashNeeded) {
      change = received - totalCashNeeded;
    }
  }

  const queryClient = useQueryClient();

  const checkoutMutation = useMutation({
    mutationFn: () => completeSale({
      cartItems: items,
      subtotal: getSubtotal(),
      totalDiscount: getTotalDiscount(),
      totalAmount: total,
      payments: parsedPayments.filter(p => p.amount > 0),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['active-accounts'] });
      onSuccess(data.invoiceId, data.invoiceNumber, change);
    },
    onError: (err: any) => {
      toast.error('حدث خطأ أثناء حفظ الفاتورة: ' + err.message);
    }
  });

  const handleAddPayment = () => {
    if (accounts.length === 0) return;
    setPayments([...payments, { 
      id: nanoid(), 
      accountId: accounts[0].id, 
      amountInput: remaining > 0 ? (remaining / 100).toString() : '0' 
    }]);
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleUpdatePayment = (id: string, field: keyof PaymentRow, value: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface w-full max-w-md rounded-[24px] md:rounded-2xl p-6 shadow-md animate-in slide-in-from-bottom-4 md:zoom-in-95 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">إتمام الدفع</h2>
          <button onClick={onClose} disabled={checkoutMutation.isPending} className="p-2 hover:bg-muted rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pb-4 hide-scrollbar">
          <div className="bg-muted/50 rounded-xl p-4 flex flex-col items-center justify-center mb-6">
            <span className="text-text-secondary text-sm mb-1">المبلغ المطلوب</span>
            <span className="text-4xl font-bold numeric text-accent">{formatMoney(total)}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium">طرق الدفع</label>
              <button 
                onClick={handleAddPayment}
                className="text-accent text-sm font-bold flex items-center gap-1 hover:bg-accent/10 px-2 py-1 rounded-lg"
              >
                <Plus className="w-4 h-4" /> إضافة طريقة
              </button>
            </div>
            
            {payments.map((p, index) => (
              <div key={p.id} className="flex gap-2 items-center bg-background rounded-xl border border-border p-2">
                <select 
                  value={p.accountId}
                  onChange={(e) => handleUpdatePayment(p.id, 'accountId', e.target.value)}
                  className="h-11 px-2 rounded-lg bg-muted text-sm font-medium border-none outline-none focus:ring-1 focus:ring-accent w-1/2"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={p.amountInput}
                    onChange={(e) => handleUpdatePayment(p.id, 'amountInput', e.target.value)}
                    className="w-full h-11 pe-8 ps-2 rounded-lg border-none bg-muted focus:ring-1 focus:ring-accent outline-none font-bold numeric text-end"
                    style={{ direction: 'ltr' }}
                  />
                  <span className="absolute end-2 top-1/2 -translate-y-1/2 text-text-secondary text-xs">د.ع</span>
                </div>
                {payments.length > 1 && (
                  <button 
                    onClick={() => handleRemovePayment(p.id)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            {!isExactMatch && (
              <div className={cn(
                "p-3 rounded-xl border text-center text-sm font-bold",
                remaining > 0 ? "bg-warning-bg text-warning border-warning" : "bg-danger-bg text-danger border-danger"
              )}>
                {remaining > 0 ? `المبلغ غير كافٍ. لا يُسمح بالبيع الآجل. المتبقي: ${formatMoney(remaining)}` : `المبلغ زائد: ${formatMoney(Math.abs(remaining))}`}
              </div>
            )}
          </div>

          {cashIncluded && (
            <div className="mb-6 bg-surface border border-border p-4 rounded-xl">
              <label className="block font-medium mb-2 pe-1">المبلغ المستلم (نقد) اختياري للباقي</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cashReceivedInput}
                  onChange={(e) => setCashReceivedInput(e.target.value)}
                  className="w-full h-12 pe-10 ps-4 rounded-lg border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none text-xl font-bold numeric text-start bg-background"
                  style={{ direction: 'ltr' }}
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">د.ع</span>
              </div>
              {change > 0 && (
                <div className="mt-3 flex justify-between items-center bg-warning-bg text-warning px-3 py-2 rounded-lg">
                  <span className="font-medium">الباقي للعميل:</span>
                  <span className="numeric font-bold text-lg">{formatMoney(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border shrink-0 mt-auto">
          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending || !isExactMatch}
            className="w-full h-[var(--btn-height)] bg-accent text-white font-bold rounded-lg disabled:opacity-50 hover:bg-accent-hover transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {checkoutMutation.isPending ? (
              <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            تأكيد الدفع
          </button>
        </div>
      </div>
    </div>
  );
}

// Separate component for the Success view
import { ReceiptOverlay } from '@/components/receipt/ReceiptOverlay';

export function SuccessDialog({ 
  isOpen, 
  invoiceId,
  invoiceNumber, 
  change,
  onClose,
  onNewSale 
}: { 
  isOpen: boolean; 
  invoiceId: string;
  invoiceNumber: string; 
  change: number;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowReceipt(false);
      setInvoiceData(null);
    }
  }, [isOpen]);

  const handleShowReceipt = async () => {
    if (!invoiceId) return;
    try {
      const data = await getInvoiceWithItems(invoiceId);
      if (data) {
        setInvoiceData(data);
        setShowReceipt(true);
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تحميل الإيصال');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  if (showReceipt && invoiceData) {
    return (
      <ReceiptOverlay 
        isOpen={true} 
        onClose={onNewSale} 
        invoice={invoiceData} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface w-full max-w-sm rounded-[24px] md:rounded-2xl p-8 shadow-md text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-success-bg text-success rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-success mb-2">تمت العملية بنجاح</h2>
        <p className="text-text-secondary mb-6 flex items-center gap-2 justify-center">
          <FileText className="w-4 h-4" /> فاتورة {invoiceNumber}
        </p>

        {change > 0 && (
          <div className="w-full p-4 bg-warning-bg rounded-xl text-warning mb-6">
            <span className="block text-sm mb-1">الباقي للعميل</span>
            <span className="block text-2xl font-bold numeric">{formatMoney(change)}</span>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={handleShowReceipt}
            className="flex-1 h-[var(--btn-height)] bg-surface border border-border text-text-primary font-bold rounded-lg hover:border-accent transition-colors"
          >
            عرض الإيصال
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 h-[var(--btn-height)] bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors"
          >
            بيع جديد
          </button>
        </div>
      </div>
    </div>
  );
}
