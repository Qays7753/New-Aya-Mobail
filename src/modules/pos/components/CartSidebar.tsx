import { useState } from 'react';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { formatMoney } from '@/lib/money';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentDialog, SuccessDialog } from './PaymentDialog';

export function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTotalDiscount, getTotal } = useCartStore();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ isOpen: boolean; invoiceNumber: string; change: number }>({
    isOpen: false,
    invoiceNumber: '',
    change: 0
  });

  const handleCompleteSale = () => {
    if (items.length === 0) return;
    setIsPaymentOpen(true);
  };

  return (
    <>
      <div className="w-full h-full bg-surface border-s border-border flex flex-col pt-4 pb-0">
        <div className="px-4 pb-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            السلة <span className="bg-accent text-white text-sm px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          {items.length > 0 && (
            <button 
              onClick={() => {
                if (window.confirm('هل أنت متأكد من مسح السلة؟')) clearCart();
              }}
              className="text-danger text-sm hover:underline"
            >
              مسح السلة
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
              <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="bg-muted/50 rounded-lg p-3 flex flex-col gap-2 relative group">
                <div className="flex justify-between items-start">
                  <span className="font-semibold line-clamp-2 leading-tight">{item.product.name}</span>
                  <span className="numeric font-bold">{formatMoney(item.product.sale_price)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-3 bg-surface border border-border rounded-full p-1">
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-50 text-text-secondary"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="numeric w-4 text-center font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted text-text-secondary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.cartItemId)}
                    className="p-2 text-text-secondary hover:text-danger transition-colors bg-surface rounded-full shadow-sm"
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
              <span className="numeric text-accent">{formatMoney(getTotal())}</span>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={items.length === 0}
            className="w-full h-[var(--btn-height)] bg-accent text-white font-bold rounded-lg disabled:opacity-50 disabled:bg-muted disabled:text-text-secondary hover:bg-accent-hover transition-colors shadow-sm"
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
          setSuccessData({ isOpen: true, invoiceNumber: number, change });
        }}
      />

      <SuccessDialog
        isOpen={successData.isOpen}
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

function ShoppingCartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
