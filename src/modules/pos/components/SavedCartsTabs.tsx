import { useState } from 'react';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { useCartStore } from '@/stores/cart.store';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';

export function SavedCartsTabs() {
  const { savedCarts, deleteCart } = useSavedCartsStore();
  const { activeCartId, switchToCart, saveAsNewCart, items } = useCartStore();
  
  const [cartToDelete, setCartToDelete] = useState<string | null>(null);

  // Long press logic
  let pressTimer: ReturnType<typeof setTimeout>;
  
  const handleTouchStart = (id: string) => {
    pressTimer = setTimeout(() => {
      setCartToDelete(id);
    }, 500);
  };
  
  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const handleAddCart = () => {
    if (savedCarts.length >= 3) return;
    
    // We create a completely new empty cart by briefly clearing the store 
    // OR we can just instruct the store to create an empty one.
    // Wait, saveAsNewCart takes the CURRENT items. If we want a new EMPTY cart...
    // The requirement says: "إنشاء سلة جديدة بعنوان 'سلة #N' + التبديل إليها"
    // Does it copy current or is it empty? "أضف saveAsNewCart: يأخذ نسخة من المحتوى الحالي"
    // And for "+", it says "زار + لإضافة سلة جديدة ... إنشاء سلة جديدة بعنوان... + التبديل إليها"
    // Since saveAsNewCart takes a copy, if the current cart has items, creating a new cart copys them.
    // But usually "+" means a completely fresh empty cart. 
    // Let's create an empty cart by switching to default, then saveAsNewCart.
    const newName = `سلة ${new Date().toLocaleTimeString('ar-IQ', {hour: '2-digit', minute:'2-digit'})}`;
    
    // Actually, saveCart from savedCarts.store takes items.
    const res = useSavedCartsStore.getState().saveCart(newName, [], 'amount', 0);
    if (res.success && res.newCartId) {
      switchToCart(res.newCartId);
    }
  };

  const handleDelete = () => {
    if (cartToDelete) {
      deleteCart(cartToDelete);
      if (activeCartId === cartToDelete) {
        // switch to another cart, or default
        const remaining = useSavedCartsStore.getState().savedCarts;
        if (remaining.length > 0) {
          switchToCart(remaining[0].id);
        } else {
          switchToCart('default');
        }
      }
      setCartToDelete(null);
    }
  };

  return (
    <>
      <div className="h-12 w-full border-b border-border bg-background flex items-center px-2 z-10 shrink-0">
        <div className="flex-1 flex gap-2 h-full items-end overflow-x-auto no-scrollbar">
          {activeCartId === 'default' && items.length > 0 && (
            <div 
              className="h-10 min-w-[100px] px-4 flex items-center justify-center rounded-t-lg bg-surface border-border border-t border-x cursor-pointer shrink-0"
              onClick={() => {}}
            >
              <span className={cn("text-sm font-medium", "text-[#CF694A]")}>الحالية (غير محفوظة)</span>
              {items.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-danger ms-2" />}
            </div>
          )}
          {savedCarts.map(cart => {
            const isActive = activeCartId === cart.id;
            return (
              <div 
                key={cart.id}
                onMouseDown={() => handleTouchStart(cart.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(cart.id)}
                onTouchEnd={handleTouchEnd}
                onClick={() => switchToCart(cart.id)}
                className={cn(
                  "h-10 min-w-[100px] px-4 flex items-center justify-center rounded-t-lg cursor-pointer transition-colors shrink-0",
                  isActive 
                    ? "bg-white border-b-[3px] border-b-[#CF694A] text-text" 
                    : "bg-[#F3F1EC] text-[#6D6A62] pb-[3px]"
                )}
              >
                <span className="text-sm font-medium truncate max-w-[120px]">{cart.name}</span>
                {cart.items.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-danger ms-2 shrink-0" />}
              </div>
            );
          })}
          
          {savedCarts.length < 3 && (
            <button 
              onClick={handleAddCart}
              className="w-12 h-10 flex items-center justify-center hover:bg-muted text-text-secondary transition-colors mb-[3px] rounded-t-lg shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <Dialog isOpen={cartToDelete !== null} onClose={() => setCartToDelete(null)} title="تأكيد الإغلاق">
        <p className="mb-6">هل أنت متأكد من إغلاق هذه السلة وحذف محتوياتها؟</p>
        <div className="flex gap-3">
          <button 
            onClick={handleDelete}
            className="flex-1 h-11 bg-danger text-white font-bold rounded-lg"
          >
            إغلاق وحذف
          </button>
          <button 
            onClick={() => setCartToDelete(null)}
            className="flex-1 h-11 bg-surface border border-border rounded-lg"
          >
            إلغاء
          </button>
        </div>
      </Dialog>
    </>
  );
}
