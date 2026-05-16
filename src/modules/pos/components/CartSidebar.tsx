import { useState, useEffect, useRef } from 'react';
import { useCartStore, CartItem, calculateItemLineTotal } from '@/stores/cart.store';
import { useSavedCartsStore } from '@/stores/savedCarts.store';
import { formatMoney } from '@/lib/money';
import { Plus, Minus, Trash2, ShoppingCart as ShoppingCartIcon, UserPlus, X, Hash, Percent, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentDialog, SuccessDialog } from './PaymentDialog';
import { toast } from 'sonner';
import { NumPad } from '@/components/ui/NumPad';

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
  const [digits, setDigits] = useState('');

  const titles: Record<ActionType, string> = {
    qty: 'الكمية',
    discount: 'خصم %',
    price: 'السعر',
  };

  const displayValue = () => {
    if (!digits) return '—';
    if (action === 'qty') return digits;
    if (action === 'discount') return `${digits}%`;
    // price: treat digits as fils → show as dinars
    const fils = parseInt(digits, 10) || 0;
    return formatMoney(fils);
  };

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
        className="bg-surface rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '16px', fontWeight: 700 }}>
            {titles[action]}
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Product name */}
        <p className="text-text-secondary mb-3 truncate" style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '13px' }}>
          {item.product.name}
        </p>

        {/* Display */}
        <div
          className="w-full text-center mb-4 py-3 rounded-xl bg-muted"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 700, color: '#CF694A', minHeight: '64px' }}
        >
          {displayValue()}
        </div>

        <NumPad
          onDigit={d => setDigits(prev => {
            if (action === 'discount') {
              const next = prev + d;
              return parseInt(next, 10) > 100 ? '100' : next;
            }
            return prev + d;
          })}
          onClear={() => setDigits(prev => prev.slice(0, -1))}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

// ─── Customer quick-add dialog ────────────────────────────────────────────────
function CustomerDialog({ onClose, onSave }: { onClose: () => void; onSave: (name: string, phone: string) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '16px', fontWeight: 700 }}>إضافة عميل</span>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full"><X className="w-5 h-5 text-text-secondary" /></button>
        </div>
        <input
          ref={nameRef}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="اسم العميل"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted focus:outline-none focus:border-accent text-sm"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        />
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="رقم الهاتف (اختياري)"
          type="tel"
          dir="ltr"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted focus:outline-none focus:border-accent text-sm"
        />
        <button
          onClick={() => { if (name.trim()) { onSave(name.trim(), phone.trim()); onClose(); } }}
          disabled={!name.trim()}
          className="w-full py-3 rounded-lg bg-[#CF694A] text-white font-bold disabled:opacity-50"
          style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '15px', touchAction: 'manipulation' }}
        >
          تأكيد
        </button>
      </div>
    </div>
  );
}

// ─── Main CartSidebar ─────────────────────────────────────────────────────────
export function CartSidebar() {
  const {
    items, removeItem, updateQuantity, clearCart,
    getSubtotal, getTotalDiscount, getTotal,
    pulseTrigger,
    setItemDiscount, setItemPrice,
    customerName, customerPhone, setCustomer, clearCustomer,
  } = useCartStore();
  useSavedCartsStore();
  const cartStore = useCartStore();

  const [pulse, setPulse] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);

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
    const val = parseInt(raw, 10);
    if (isNaN(val)) return;
    if (action === 'qty') {
      updateQuantity(selectedItemId, Math.max(1, val));
    } else if (action === 'discount') {
      setItemDiscount(selectedItemId, 'percent', Math.min(100, Math.max(0, val)));
    } else if (action === 'price') {
      setItemPrice(selectedItemId, Math.max(0, val));
    }
  };

  return (
    <>
      <div className="w-full h-full bg-surface border-s border-border flex flex-col overflow-hidden">

        {/* ── Customer header ── 52px */}
        <div className="shrink-0 px-3 border-b border-border" style={{ height: '52px', display: 'flex', alignItems: 'center' }}>
          {customerName ? (
            <div className="flex items-center gap-2 w-full min-w-0">
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold leading-none" style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '13px' }}>{customerName}</p>
                {customerPhone && (
                  <p className="truncate text-text-secondary" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>{customerPhone}</p>
                )}
              </div>
              <button
                onClick={clearCustomer}
                className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full hover:bg-muted text-text-secondary"
                style={{ touchAction: 'manipulation' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerDialog(true)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              style={{ touchAction: 'manipulation', fontFamily: 'Tajawal, sans-serif', fontSize: '13px' }}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>إضافة عميل</span>
            </button>
          )}
        </div>

        {/* ── Cart header ── */}
        <div className={cn('px-3 py-2 border-b border-border flex items-center justify-between shrink-0 transition-all', pulse && 'bg-accent/10')}>
          <h2 className="font-bold flex items-center gap-1.5" style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '14px' }}>
            السلة <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">{items.length}</span>
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => { if (window.confirm('هل أنت متأكد من مسح السلة؟')) clearCart(); }}
              className="p-1.5 text-danger hover:bg-danger/10 rounded-full transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Items list — only scroll zone ── */}
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
            {getTotalDiscount() > 0 && (
              <div className="flex justify-between text-danger">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم</span>
                <span className="numeric">− {formatMoney(getTotalDiscount())}</span>
              </div>
            )}
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

      {/* Customer dialog */}
      {showCustomerDialog && (
        <CustomerDialog
          onClose={() => setShowCustomerDialog(false)}
          onSave={(name, phone) => setCustomer(name, phone)}
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
    </>
  );
}
