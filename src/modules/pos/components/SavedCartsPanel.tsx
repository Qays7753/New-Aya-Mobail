import { useState } from 'react';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { useCartStore } from '@/stores/cart.store';
import { formatMoney } from '@/lib/money';
import { X, Save, Trash2, ArrowRightLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';

export function SavedCartsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { savedCarts, restoreCart, deleteCart } = useSavedCartsStore();
  const cartStore = useCartStore();

  const handleRestore = (id: string, name: string) => {
    if (cartStore.items.length > 0) {
      if (!window.confirm("السلة الحالية فيها منتجات. استعادة السلة المحفوظة ستحل محلها. هل أنت متأكد؟")) {
        return;
      }
    }
    restoreCart(id, cartStore);
    toast.success(`تم استعادة السلة: ${name}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 start-0 z-40 w-80 bg-surface shadow-2xl flex flex-col border-e border-border animate-in slide-in-from-start">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Save className="w-5 h-5 text-accent" />
          السلات المحفوظة ({savedCarts.length}/3)
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {savedCarts.length === 0 ? (
          <div className="text-center p-8 text-text-secondary opacity-70">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <p>لا توجد سلات محفوظة</p>
          </div>
        ) : (
          savedCarts.map(cart => (
            <div key={cart.id} className="bg-background border border-border p-4 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-md text-text-primary line-clamp-1">{cart.name}</h3>
                  <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(cart.createdAt), 'yyyy/MM/dd HH:mm')}
                  </div>
                </div>
              </div>
              
              <div className="text-sm bg-muted/50 p-2 rounded-lg">
                <span className="font-medium">{cart.items.length}</span> منتجات
              </div>

              <div className="flex justify-between pt-2 border-t border-border mt-1">
                <button 
                  onClick={() => handleRestore(cart.id, cart.name)}
                  className="text-accent text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  استعادة
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("حذف هذه السلة المحفوظة؟")) {
                      deleteCart(cart.id);
                    }
                  }}
                  className="text-danger text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
