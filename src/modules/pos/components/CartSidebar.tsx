import { useState } from 'react';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { formatMoney } from '@/lib/money';
import { Plus, Minus, Trash2, ShoppingCart as ShoppingCartIcon, Save, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentDialog, SuccessDialog } from './PaymentDialog';
import { SavedCartsPanel } from './SavedCartsPanel';
import { Dialog } from '@/components/ui/Dialog';
import { toast } from 'sonner';

export function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTotalDiscount, getTotal } = useCartStore();
  const { savedCarts, saveCart } = useSavedCartsStore();
  const cartStore = useCartStore(); // to pass to restoring if needed
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSavedCartsOpen, setIsSavedCartsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [cartNameInput, setCartNameInput] = useState('');
  
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
  
  const handleSaveCart = () => {
    if (!cartNameInput.trim()) {
      toast.error('يرجى إدخال اسم للسلة');
      return;
    }
    const res = saveCart(cartNameInput, cartStore.items, cartStore.globalDiscountType, cartStore.globalDiscountValue);
    if (res.success) {
      toast.success('تم حفظ السلة بنجاح');
      clearCart();
      setIsSaveDialogOpen(false);
      setCartNameInput('');
    } else {
      toast.error(res.error || 'فشل حفظ السلة');
    }
  };

  return (
    <>
      <SavedCartsPanel isOpen={isSavedCartsOpen} onClose={() => setIsSavedCartsOpen(false)} />
      
      <div className="w-full h-full bg-surface border-s border-border flex flex-col pt-4 pb-0">
        <div className="px-4 pb-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            السلة <span className="bg-accent text-white text-sm px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSavedCartsOpen(true)}
              className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-full transition-colors relative"
            >
              <Clock className="w-5 h-5" />
              {savedCarts.length > 0 && <span className="absolute top-0 end-0 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full leading-none">{savedCarts.length}</span>}
            </button>
            {items.length > 0 && (
              <button 
                onClick={() => {
                  if (savedCarts.length >= 3) {
                    toast.error('تم الوصول للحد الأقصى (3 سلات)');
                    return;
                  }
                  setCartNameInput(`سلة ${new Date().toLocaleTimeString('ar-IQ', {hour: '2-digit', minute:'2-digit'})}`);
                  setIsSaveDialogOpen(true);
                }}
                className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
                title="حفظ السلة مؤقتاً"
              >
                <Save className="w-5 h-5" />
              </button>
            )}
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
      {/* Save Cart Dialog */}
      <Dialog isOpen={isSaveDialogOpen} onClose={() => setIsSaveDialogOpen(false)} title="حفظ السلة مؤقتاً">
        <label className="block text-sm font-medium mb-1">اسم السلة</label>
        <input 
          type="text" 
          value={cartNameInput}
          onChange={(e) => setCartNameInput(e.target.value)}
          maxLength={30}
          className="w-full h-11 px-3 rounded-xl border border-border focus:border-accent bg-background outline-none mb-6"
        />
        <div className="flex gap-3">
          <button 
            onClick={handleSaveCart}
            className="flex-1 h-11 bg-accent text-white font-bold rounded-lg"
          >
            حفظ
          </button>
          <button 
            onClick={() => setIsSaveDialogOpen(false)}
            className="flex-1 h-11 bg-surface border border-border rounded-lg"
          >
            إلغاء
          </button>
        </div>
      </Dialog>
    </>
  );
}
