import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveAccounts, Account } from '@/db/queries/accounts';
import { completeSale } from '@/db/queries/sales';
import { formatMoney, parseMoney, subMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { X, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoiceId: string, invoiceNumber: string, change: number) => void;
}

export function PaymentDialog({ isOpen, onClose, onSuccess }: PaymentDialogProps) {
  const { items, getSubtotal, getTotalDiscount, getTotal, clearCart } = useCartStore();
  const total = getTotal();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [receivedInput, setReceivedInput] = useState<string>('');
  const [change, setChange] = useState(0);

  const { data: accounts = [] } = useQuery({
    queryKey: ['active-accounts'],
    queryFn: getActiveAccounts,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setReceivedInput((total / 100).toString());
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [isOpen, total, accounts, selectedAccountId]);

  useEffect(() => {
    const received = parseMoney(receivedInput);
    if (received >= total) {
      setChange(subMoney(received, total));
    } else {
      setChange(0);
    }
  }, [receivedInput, total]);

  const queryClient = useQueryClient();

  const checkoutMutation = useMutation({
    mutationFn: () => completeSale({
      cartItems: items,
      subtotal: getSubtotal(),
      totalDiscount: getTotalDiscount(),
      totalAmount: total,
      paidAmount: total, // we always assume full payment locally without customer debt right now
      accountId: selectedAccountId,
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

        <div className="overflow-y-auto flex-1 pb-4">
          <div className="bg-muted/50 rounded-xl p-4 flex flex-col items-center justify-center mb-6">
            <span className="text-text-secondary text-sm mb-1">المبلغ المطلوب</span>
            <span className="text-4xl font-bold numeric text-accent">{formatMoney(total)}</span>
          </div>

          <div className="mb-6">
            <label className="block font-medium mb-3">حساب الدفع</label>
            <div className="grid grid-cols-2 gap-3">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    "p-3 rounded-xl border text-start transition-colors font-medium border-border",
                    selectedAccountId === acc.id
                      ? "bg-text-primary text-white border-transparent"
                      : "bg-surface hover:border-accent"
                  )}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {selectedAccountId && accounts.find(a => a.id === selectedAccountId)?.type === 'cash' && (
            <div className="mb-6 bg-surface border border-border p-4 rounded-xl">
              <label className="block font-medium mb-2">المبلغ المستلم (نقد)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={receivedInput}
                  onChange={(e) => setReceivedInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none text-xl font-bold numeric bg-background"
                />
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

        <div className="pt-4 border-t border-border shrink-0">
          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={!selectedAccountId || checkoutMutation.isPending || (parseMoney(receivedInput) < total)}
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
export function SuccessDialog({ 
  isOpen, 
  invoiceNumber, 
  change,
  onClose,
  onNewSale 
}: { 
  isOpen: boolean; 
  invoiceNumber: string; 
  change: number;
  onClose: () => void;
  onNewSale: () => void;
}) {
  if (!isOpen) return null;

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
            onClick={() => {
              /* Handle Print/Share Receipt */
              toast.success('جارٍ تحضير الإيصال للمشاركة...');
            }}
            className="flex-1 h-[var(--btn-height)] bg-surface border border-border text-text-primary font-bold rounded-lg hover:border-accent transition-colors"
          >
            مشاركة الإيصال
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
