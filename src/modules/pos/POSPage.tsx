import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductGrid } from "./components/ProductGrid";
import { CartSidebar } from "./components/CartSidebar";
import { SavedCartsTabs } from "./components/SavedCartsTabs";
import { seedProductsIfEmpty } from "@/db/queries/products";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart.store";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ShoppingCart, X, Settings } from "lucide-react";

export default function POSPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { items, getTotal, pulseTrigger } = useCartStore();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (pulseTrigger > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [pulseTrigger]);

  useEffect(() => {
    seedProductsIfEmpty().then(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });
  }, [queryClient]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex relative overflow-hidden bg-background">

      {/* ── Desktop Cart Sidebar — 360px, RIGHT side (first in RTL flex) ── */}
      <div className="hidden lg:flex w-[360px] shrink-0 h-full border-e border-border bg-surface shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)] z-10 flex-col">
        <CartSidebar />
      </div>

      {/* ── Settings / Exit button (top-start of products area) ── */}
      <button
        onClick={() => navigate('/dashboard')}
        className="hidden lg:flex absolute top-3 start-[368px] z-20 w-11 h-11 items-center justify-center rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors shadow-sm"
        title="العودة للرئيسية"
        style={{ touchAction: 'manipulation', userSelect: 'none' }}
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* ── Main Products Area — fills remaining space, LEFT side ── */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        <SavedCartsTabs />
        <div className="flex-1 overflow-hidden min-h-0">
          <ProductGrid />
        </div>
      </div>

      {/* ── Mobile Cart Button ── */}
      {!showMobileCart && totalItems > 0 && (
        <button
          onClick={() => setShowMobileCart(true)}
          className={cn(
            "lg:hidden absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] start-1/2 -translate-x-1/2 bg-text-primary text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-bold z-20 animate-in slide-in-from-bottom transition-transform",
            pulse && "scale-110"
          )}
          style={{ touchAction: 'manipulation' }}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -end-2 bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          </div>
          <span>عرض السلة</span>
          <span className="numeric ms-2 border-s border-white/20 ps-4">
            {formatMoney(getTotal())}
          </span>
        </button>
      )}

      {/* ── Mobile Cart Overlay (bottom sheet) ── */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom">
          <div className="p-4 flex items-center justify-between border-b border-border bg-surface shrink-0">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>عربة التسوق</h2>
            <button
              onClick={() => setShowMobileCart(false)}
              className="p-2 hover:bg-muted rounded-full"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-6 h-6 text-text-secondary" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CartSidebar />
          </div>
        </div>
      )}
    </div>
  );
}
