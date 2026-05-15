import { useState, useEffect } from 'react';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { formatMoney } from '@/lib/money';
import { Plus, Minus, Trash2, ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentDialog, SuccessDialog } from './PaymentDialog';
import { toast } from 'sonner';

export function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTotalDiscount, getTotal, pulseTrigger } = useCartStore();
  useSavedCartsStore();
  const cartStore = useCartStore(); // to pass to restoring if needed
  
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (pulseTrigger > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [pulseTrigger]);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  const [successData, setSuccessData] = useState<{ isOpen: boolean; invoiceId: string; invoiceNumber: string; change: number }>({
    isOpen: false,
    invoiceId: '',
    invoiceNumber: '',
    change: 0
  });

  const handleCompleteSale = () => {
    if (items.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handleDelete = (item: CartItem) => {
    const itemCopy = { ...item };
    removeItem(item.cartItemId);
    toast('تم حذف العنصر', {
      action: {
        label: 'تراجع',
        onClick: () => cartStore.restoreItem(itemCopy),
      },
      duration: 5000,
    });
  };

  return (
    <>
      <div className="w-full h-full bg-surface border-s border-border flex flex-col pt-4 pb-0">
        <div className={cn("px-4 pb-4 border-b border-border flex items-center justify-between shrink-0 transition-all", pulse && "bg-accent/10 rounded-xl mx-2 scale-[1.02]")}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            السلة <span className="bg-accent text-white text-sm px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          <div className="flex gap-2">
            {items.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من مسح السلة؟')) clearCart();
                }}
                className="p-2 text-danger hover:bg-danger/10 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
              <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="bg-muted/50 rounded-lg px-3 h-[80px] flex flex-col justify-center relative group shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold line-clamp-1 leading-tight text-sm pe-2">{item.product.name}</span>
                  <span className="numeric font-bold">{formatMoney(item.product.sale_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-full p-0.5">
                    <button 
                      onClick={() => {
                        if (item.quantity <= 1) {
                          handleDelete(item);
                        } else {
                          updateQuantity(item.cartItemId, item.quantity - 1);
                        }
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted text-text-secondary"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="numeric w-5 text-center font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted text-text-secondary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(item)}
                    className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-danger transition-colors bg-surface rounded-full shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border bg-background shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4">
          <div className="space-y-2 mb-4 text-sm font-medium">
            <div className="flex justify-between text-text-secondary">
              <span>المجموع</span>
              <span className="numeric">{formatMoney(getSubtotal())}</span>
            </div>
            {getTotalDiscount() > 0 && (
               <div className="flex justify-between text-danger">
                 <span>الخصم</span>
                 <span className="numeric">- {formatMoney(getTotalDiscount())}</span>
               </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border border-dashed text-lg font-bold">
              <span>الإجمالي</span>
              <span className="numeric text-accent" style={{ fontFamily: 'Inter', fontSize: '20px' }}>{formatMoney(getTotal())}</span>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={items.length === 0}
            className="w-full h-16 bg-[#CF694A] text-white rounded-lg disabled:opacity-50 disabled:bg-muted disabled:text-text-secondary hover:opacity-90 transition-opacity shadow-sm"
            style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '18px', fontWeight: 'bold' }}
          >
            إتمام البيع
          </button>
        </div>
      </div>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={(id, number, change) => {
          setIsPaymentOpen(false);
          setSuccessData({ isOpen: true, invoiceId: id, invoiceNumber: number, change });
        }}
      />

      <SuccessDialog
        isOpen={successData.isOpen}
        invoiceId={successData.invoiceId}
        invoiceNumber={successData.invoiceNumber}
        change={successData.change}
        onClose={() => setSuccessData({ ...successData, isOpen: false })}
        onNewSale={() => {
          setSuccessData({ ...successData, isOpen: false });
          clearCart();
        }}
      />
    </>
  );
}
