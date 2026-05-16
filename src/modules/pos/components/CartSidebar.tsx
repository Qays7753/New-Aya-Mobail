import { useState, useEffect } from 'react';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { formatMoney, mulMoney, applyPercent, subMoney } from '@/lib/money';
import { Plus, Minus, Trash2, ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentDialog, SuccessDialog } from './PaymentDialog';
import { toast } from 'sonner';

function getLineAmounts(item: CartItem) {
  const sub = mulMoney(item.product.sale_price, item.quantity);
  let dAmt = 0;
  if (item.discountType === 'amount') {
    dAmt = item.discountValue;
  } else {
    dAmt = applyPercent(sub, item.discountValue);
  }
  if (dAmt > sub) dAmt = sub;
  return { subtotal: sub, discountAmt: dAmt, total: subMoney(sub, dAmt) };
}

export function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTotalDiscount, getTotal, pulseTrigger } = useCartStore();
  useSavedCartsStore();
  const cartStore = useCartStore();

  const [pulse, setPulse] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (pulseTrigger > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [pulseTrigger]);

  // Deselect if item removed
  useEffect(() => {
    if (selectedItemId && !items.find(i => i.cartItemId === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [items, selectedItemId]);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ isOpen: boolean; invoiceId: string; invoiceNumber: string; change: number }>({
    isOpen: false,
    invoiceId: '',
    invoiceNumber: '',
    change: 0,
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
      <div className="w-full h-full bg-surface border-s border-border flex flex-col">
        {/* Header */}
        <div
          className={cn(
            'px-4 py-3 border-b border-border flex items-center justify-between shrink-0 transition-all',
            pulse && 'bg-accent/10'
          )}
        >
          <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            السلة{' '}
            <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('هل أنت متأكد من مسح السلة؟')) clearCart();
              }}
              className="p-2 text-danger hover:bg-danger/10 rounded-full transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Items list — only scrolling area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary py-12">
              <ShoppingCartIcon className="w-14 h-14 mb-3 opacity-40" />
              <p style={{ fontFamily: 'Tajawal, sans-serif' }}>السلة فارغة</p>
            </div>
          ) : (
            items.map(item => {
              const { discountAmt, total } = getLineAmounts(item);
              const isSelected = selectedItemId === item.cartItemId;

              return (
                <div
                  key={item.cartItemId}
                  onClick={() => setSelectedItemId(isSelected ? null : item.cartItemId)}
                  style={{
                    height: '88px',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    border: isSelected ? '1.5px solid #CF694A' : '1.5px solid transparent',
                    backgroundColor: isSelected ? '#FCF4F1' : 'var(--color-muted, #F5F4F0)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                  className="flex items-center gap-2 px-2 shrink-0 relative"
                >
                  {/* Quantity badge */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: '#FCF4F1',
                      borderRadius: '8px',
                      border: '1px solid #F0E0DA',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0px',
                    }}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#CF694A', lineHeight: 1 }}>
                      {item.quantity}
                    </span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '9px', color: '#CF694A', opacity: 0.8 }}>
                      وحدة
                    </span>
                  </div>

                  {/* Middle info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span
                      className="truncate block"
                      style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}
                    >
                      {item.product.name}
                    </span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      السعر: {formatMoney(item.product.sale_price)}
                    </span>
                    {discountAmt > 0 && (
                      <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '11px', color: '#DC2626' }}>
                        الخصم: − {formatMoney(discountAmt)}
                      </span>
                    )}
                  </div>

                  {/* Line total */}
                  <span
                    className="shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}
                  >
                    {formatMoney(total)}
                  </span>

                  {/* −/+ quick buttons bottom-start corner */}
                  <div
                    className="absolute bottom-1.5 start-1.5 flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) handleDelete(item);
                        else updateQuantity(item.cartItemId, item.quantity - 1);
                      }}
                      style={{ width: '32px', height: '32px', touchAction: 'manipulation' }}
                      className="rounded-full flex items-center justify-center bg-surface border border-border text-text-secondary hover:bg-muted"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      style={{ width: '32px', height: '32px', touchAction: 'manipulation' }}
                      className="rounded-full flex items-center justify-center bg-surface border border-border text-text-secondary hover:bg-muted"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete button top-end corner */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item); }}
                    style={{ position: 'absolute', top: '6px', insetInlineEnd: '6px', width: '28px', height: '28px', touchAction: 'manipulation' }}
                    className="rounded-full flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Totals + Pay — fixed */}
        <div className="shrink-0 border-t border-border bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3 flex flex-col gap-3">
          <div className="space-y-1.5 text-sm font-medium">
            <div className="flex justify-between text-text-secondary">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع الفرعي</span>
              <span className="numeric">{formatMoney(getSubtotal())}</span>
            </div>
            {getTotalDiscount() > 0 && (
              <div className="flex justify-between text-danger">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم</span>
                <span className="numeric">− {formatMoney(getTotalDiscount())}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-dashed border-border">
              <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '15px', fontWeight: 700 }}>الإجمالي</span>
              <span
                className="numeric"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 700, color: '#CF694A' }}
              >
                {formatMoney(getTotal())}
              </span>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={items.length === 0}
            className="w-full h-16 bg-[#CF694A] text-white rounded-lg disabled:opacity-50 disabled:bg-muted disabled:text-text-secondary hover:opacity-90 transition-opacity shadow-sm"
            style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '18px', fontWeight: 'bold', touchAction: 'manipulation' }}
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
