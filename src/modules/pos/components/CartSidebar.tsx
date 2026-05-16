import { useState } from 'react';
import { useCartStore, CartItem, calculateItemLineTotal } from '@/stores/cart.store';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { formatMoney, parseMoney } from '@/lib/money';
import { Plus, Minus, Trash2, ShoppingCart as ShoppingCartIcon, X, Hash, Percent, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentDialog, SuccessDialog } from './PaymentDialog';
import { toast } from 'sonner';
import { NumPad } from '@/components/ui/NumPad';
import { useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// ─── NumPad action dialog ──────────────────────────────────────────────────────
type ActionType = 'qty' | 'discount' | 'price';

function ActionDialog({
  action,
  item,
  onClose,
  onApply,
}: {
  action: ActionType;
  item: CartItem;
  onClose: () => void;
  onApply: (action: ActionType, raw: string) => void;
}) {
  const initDigits = (): string => {
    if (action === 'qty') return String(item.quantity);
    if (action === 'discount') {
      return item.discountType === 'percent' && item.discountValue > 0
        ? String(item.discountValue)
        : '';
    }
    if (action === 'price') {
      const unitPrice = item.overridePrice !== undefined ? item.overridePrice : item.product.sale_price;
      if (unitPrice <= 0) return '';
      const dinars = unitPrice / 100;
      return Number.isInteger(dinars)
        ? String(dinars)
        : dinars.toFixed(2).replace(/\.?0+$/, '');
    }
    return '';
  };

  const [digits, setDigits] = useState<string>(initDigits);
  const dialogRef = useFocusTrap(true);

  const titles: Record<ActionType, string> = {
    qty: 'الكمية',
    discount: 'خصم %',
    price: 'السعر',
  };

  const displayValue = (): string => {
    if (!digits) return '—';
    if (action === 'qty') return digits;
    if (action === 'discount') return `${digits}%`;
    return `${digits} د.أ`;
  };

  const handleDigit = (d: string) => {
    if (action === 'discount') {
      const next = digits + d;
      setDigits(parseInt(next, 10) > 100 ? '100' : next);
      return;
    }
    if (action === 'price') {
      if (d === '.') {
        if (digits.includes('.')) return;
        setDigits(prev => (prev === '' ? '0.' : prev + '.'));
        return;
      }
      const next = digits + d;
      const dotIdx = next.indexOf('.');
      if (dotIdx >= 0 && next.length - dotIdx - 1 > 2) return;
      setDigits(next);
      return;
    }
    setDigits(prev => prev + d);
  };

  const handleClear = () => setDigits(prev => prev.slice(0, -1));

  const handleSubmit = () => {
    if (!digits) { onClose(); return; }
    onApply(action, digits);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-surface rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="تعديل قيمة"
      >
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '16px', fontWeight: 700 }}>
            {titles[action]}
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <p className="text-text-secondary mb-3 truncate" style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '13px' }}>
          {item.product.name}
        </p>

        <div
          className="w-full text-center mb-4 py-3 rounded-xl bg-muted"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 700, color: '#CF694A', minHeight: '64px' }}
        >
          {displayValue()}
        </div>

        <NumPad
          onDigit={handleDigit}
          onClear={handleClear}
          onSubmit={handleSubmit}
          allowDecimal={action === 'price'}
        />
      </div>
    </div>
  );
}

// ─── Global discount dialog ────────────────────────────────────────────────────
function GlobalDiscountDialog({
  currentValue,
  onClose,
  onApply,
}: {
  currentValue: number;
  onClose: () => void;
  onApply: (value: number) => void;
}) {
  const [digits, setDigits] = useState<string>(currentValue > 0 ? String(currentValue) : '');

  const handleSubmit = () => {
    const val = parseInt(digits, 10);
    onApply(!digits || isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '16px', fontWeight: 700 }}>
            خصم على الفاتورة كاملة
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div
          className="w-full text-center mb-4 py-3 rounded-xl bg-muted"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 700, color: '#CF694A', minHeight: '64px' }}
        >
          {digits ? `${digits}%` : '—'}
        </div>

        <NumPad
          onDigit={d => setDigits(prev => {
            const next = prev + d;
            return parseInt(next, 10) > 100 ? '100' : next;
          })}
          onClear={() => setDigits(prev => prev.slice(0, -1))}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

// ─── Main CartSidebar ──────────────────────────────────────────────────────────
export function CartSidebar() {
  const {
    items, removeItem, updateQuantity, clearCart,
    getSubtotal, getTotalDiscount, getTotal,
    pulseTrigger,
    setItemDiscount, setItemPrice,
    globalDiscountType, globalDiscountValue, setGlobalDiscount,
  } = useCartStore();
  useSavedCartsStore();
  const cartStore = useCartStore();

  const [pulse, setPulse] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [showGlobalDiscountDialog, setShowGlobalDiscountDialog] = useState(false);

  useEffect(() => {
    if (pulseTrigger > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [pulseTrigger]);

  useEffect(() => {
    if (selectedItemId && !items.find(i => i.cartItemId === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [items, selectedItemId]);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ isOpen: boolean; invoiceId: string; invoiceNumber: string; change: number }>({
    isOpen: false, invoiceId: '', invoiceNumber: '', change: 0,
  });
  const [confirmClear, setConfirmClear] = useState(false);

  const selectedItem = selectedItemId ? items.find(i => i.cartItemId === selectedItemId) ?? null : null;

  const handleDelete = (item: CartItem) => {
    const itemCopy = { ...item };
    removeItem(item.cartItemId);
    toast('تم حذف العنصر', {
      action: { label: 'تراجع', onClick: () => cartStore.restoreItem(itemCopy) },
      duration: 5000,
    });
  };

  const handleApplyAction = (action: ActionType, raw: string) => {
    if (!selectedItemId) return;
    if (action === 'qty') {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) updateQuantity(selectedItemId, Math.max(1, val));
    } else if (action === 'discount') {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) setItemDiscount(selectedItemId, 'percent', Math.min(100, Math.max(0, val)));
    } else if (action === 'price') {
      const fils = parseMoney(raw);
      setItemPrice(selectedItemId, Math.max(0, fils));
    }
  };

  const currentGlobalDiscountPct = globalDiscountType === 'percent' ? globalDiscountValue : 0;

  return (
    <>
      <div className="w-full h-full bg-surface border-s border-border flex flex-col overflow-hidden">

        {/* ── Cart header ── */}
        <div className={cn('px-3 py-2 border-b border-border flex items-center justify-between shrink-0 transition-all', pulse && 'bg-accent/10')}>
          <h2 className="font-bold flex items-center gap-1.5" style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '14px' }}>
            السلة <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">{items.length}</span>
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="p-1.5 text-danger hover:bg-danger/10 rounded-full transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Items list ── */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary py-10">
              <ShoppingCartIcon className="w-12 h-12 mb-2 opacity-40" />
              <p style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '14px' }}>السلة فارغة</p>
            </div>
          ) : (
            items.map(item => {
              const { discountAmt, total } = calculateItemLineTotal(item);
              const isSelected = selectedItemId === item.cartItemId;
              const unitPrice = item.overridePrice !== undefined ? item.overridePrice : item.product.sale_price;

              return (
                <div
                  key={item.cartItemId}
                  onClick={() => setSelectedItemId(isSelected ? null : item.cartItemId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedItemId(isSelected ? null : item.cartItemId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${item.product.name}، الكمية ${item.quantity}`}
                  style={{
                    height: '88px',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    border: isSelected ? '1.5px solid #CF694A' : '1.5px solid transparent',
                    backgroundColor: isSelected ? '#FCF4F1' : 'var(--color-muted, #F5F4F0)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                  className="flex items-center gap-2 px-2 shrink-0 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* Qty badge */}
                  <div style={{
                    width: '44px', height: '44px', backgroundColor: '#FCF4F1',
                    borderRadius: '8px', border: '1px solid #F0E0DA',
                    flexShrink: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#CF694A', lineHeight: 1 }}>
                      {item.quantity}
                    </span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '9px', color: '#CF694A', opacity: 0.8 }}>
                      وحدة
                    </span>
                  </div>

                  {/* Middle */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="truncate block" style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '14px', fontWeight: 600 }}>
                      {item.product.name}
                    </span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      السعر: {formatMoney(unitPrice)}
                      {item.overridePrice !== undefined && (
                        <span style={{ color: '#EA7317', marginInlineStart: '4px' }}>✱</span>
                      )}
                    </span>
                    {discountAmt > 0 && (
                      <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '11px', color: '#DC2626' }}>
                        الخصم: − {formatMoney(discountAmt)}
                      </span>
                    )}
                  </div>

                  {/* Line total */}
                  <span className="shrink-0 me-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {formatMoney(total)}
                  </span>

                  {/* −/+ quick controls */}
                  <div className="absolute bottom-1.5 start-1.5 flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { if (item.quantity <= 1) handleDelete(item); else updateQuantity(item.cartItemId, item.quantity - 1); }}
                      style={{ width: '28px', height: '28px', touchAction: 'manipulation' }}
                      className="rounded-full flex items-center justify-center bg-surface border border-border text-text-secondary hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      style={{ width: '28px', height: '28px', touchAction: 'manipulation' }}
                      className="rounded-full flex items-center justify-center bg-surface border border-border text-text-secondary hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item); }}
                    style={{ position: 'absolute', top: '6px', insetInlineEnd: '6px', width: '26px', height: '26px', touchAction: 'manipulation' }}
                    className="rounded-full flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ── Bottom fixed zone ── */}
        <div className="shrink-0 border-t border-border bg-background flex flex-col gap-2 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3">

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع الفرعي</span>
              <span className="numeric">{formatMoney(getSubtotal())}</span>
            </div>

            {/* Discount row — always visible (has global-discount button) */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span style={{ fontFamily: 'Tajawal, sans-serif', color: getTotalDiscount() > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                  الخصم
                </span>
                <button
                  onClick={() => setShowGlobalDiscountDialog(true)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
                  style={{ fontSize: '11px', fontFamily: 'Tajawal, sans-serif', touchAction: 'manipulation' }}
                  title="خصم على الفاتورة كاملة"
                >
                  <Percent className="w-3 h-3" />
                  <span>فاتورة</span>
                </button>
                {currentGlobalDiscountPct > 0 && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-danger/10 text-danger"
                    style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}
                  >
                    {currentGlobalDiscountPct}%
                    <button
                      onClick={() => setGlobalDiscount('percent', 0)}
                      className="hover:opacity-70 transition-opacity ms-0.5"
                      style={{ touchAction: 'manipulation' }}
                      title="إلغاء خصم الفاتورة"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              </div>
              {getTotalDiscount() > 0 ? (
                <span className="numeric text-danger">− {formatMoney(getTotalDiscount())}</span>
              ) : (
                <span className="text-text-secondary">—</span>
              )}
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-dashed border-border">
              <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '15px', fontWeight: 700 }}>الإجمالي</span>
              <span className="numeric" style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 700, color: '#CF694A' }}>
                {formatMoney(getTotal())}
              </span>
            </div>
          </div>

          {/* Action bar */}
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { action: 'qty' as ActionType, label: 'الكمية', Icon: Hash },
                { action: 'discount' as ActionType, label: 'خصم %', Icon: Percent },
                { action: 'price' as ActionType, label: 'السعر', Icon: Tag },
              ] as const
            ).map(({ action, label, Icon }) => (
              <button
                key={action}
                disabled={!selectedItemId}
                onClick={() => setActiveAction(action)}
                style={{ height: '44px', touchAction: 'manipulation', fontFamily: 'Tajawal, sans-serif', fontSize: '13px', fontWeight: 600 }}
                className={cn(
                  'rounded-lg border flex items-center justify-center gap-1 transition-colors',
                  selectedItemId
                    ? 'border-border bg-surface text-text-primary hover:bg-muted hover:border-accent'
                    : 'border-border bg-surface text-text-secondary opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Pay button */}
          <button
            onClick={() => { if (items.length > 0) setIsPaymentOpen(true); }}
            disabled={items.length === 0}
            style={{ height: '64px', fontFamily: 'Tajawal, sans-serif', fontSize: '18px', fontWeight: 'bold', touchAction: 'manipulation' }}
            className="w-full bg-[#CF694A] text-white rounded-lg disabled:opacity-50 disabled:bg-muted disabled:text-text-secondary hover:opacity-90 transition-opacity shadow-sm"
          >
            إتمام البيع
          </button>
        </div>
      </div>

      {/* NumPad action dialog */}
      {activeAction && selectedItem && (
        <ActionDialog
          action={activeAction}
          item={selectedItem}
          onClose={() => setActiveAction(null)}
          onApply={handleApplyAction}
        />
      )}

      {/* Global discount dialog */}
      {showGlobalDiscountDialog && (
        <GlobalDiscountDialog
          currentValue={currentGlobalDiscountPct}
          onClose={() => setShowGlobalDiscountDialog(false)}
          onApply={val => setGlobalDiscount('percent', val)}
        />
      )}

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
        onNewSale={() => { setSuccessData({ ...successData, isOpen: false }); clearCart(); }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="مسح السلة"
        message="هل أنت متأكد من حذف جميع العناصر من السلة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="مسح السلة"
        cancelLabel="إلغاء"
        danger
        onConfirm={() => { clearCart(); setConfirmClear(false); }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
