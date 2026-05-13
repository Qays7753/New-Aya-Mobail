import { useEffect, useState } from "react";
import { ProductGrid } from "./components/ProductGrid";
import { CartSidebar } from "./components/CartSidebar";
import { seedProductsIfEmpty } from "@/db/queries/products";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart.store";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ShoppingCart, X } from "lucide-react";

export default function POSPage() {
  const queryClient = useQueryClient();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { items, getTotal } = useCartStore();

  useEffect(() => {
    // Seed test products on mount
    seedProductsIfEmpty().then(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });
  }, [queryClient]);

  // Mobile Floating Cart Button
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex relative overflow-hidden bg-background">
      {/* Main Content (Products) */}
      <div className="flex-1 w-full lg:w-[65%] h-full">
        <ProductGrid />
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:block w-[35%] min-w-[320px] max-w-[400px] h-full shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] z-10">
        <CartSidebar />
      </div>

      {/* Mobile Cart Button */}
      {!showMobileCart && totalItems > 0 && (
        <button
          onClick={() => setShowMobileCart(true)}
          className="lg:hidden absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] start-1/2 -translate-x-1/2 bg-text-primary text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-bold z-20 animate-in slide-in-from-bottom"
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

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom">
          <div className="p-4 flex items-center justify-between border-b border-border bg-surface shrink-0">
            <h2 className="text-xl font-bold">عربة التسوق</h2>
            <button
              onClick={() => setShowMobileCart(false)}
              className="p-2 hover:bg-muted rounded-full"
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
