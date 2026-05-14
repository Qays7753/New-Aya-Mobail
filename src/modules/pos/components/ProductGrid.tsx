import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getActiveProducts, Product } from '@/db/queries/products';
import { useCartStore } from '@/stores/cart.store';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'device', label: 'أجهزة' },
  { id: 'accessory', label: 'إكسسوارات' },
  { id: 'sim', label: 'شرائح' },
  { id: 'package', label: 'باقات' },
  { id: 'service_general', label: 'خدمات عامة' },
  { id: 'service_repair', label: 'خدمات صيانة' },
];

export function ProductGrid() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { addItem } = useCartStore();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'active', debouncedSearch, category],
    queryFn: () => getActiveProducts(debouncedSearch, category),
    staleTime: Infinity,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate columns based on width
  const [columns, setColumns] = useState(2);
  
  useEffect(() => {
    if (!parentRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width >= 1024) setColumns(4); // lg
        else if (width >= 640) setColumns(3); // sm
        else setColumns(2);
      }
    });
    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil((products?.length || 0) / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // estimated height of card + gap
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filters Header */}
      <div className="p-4 bg-background shrink-0">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="بحث عن منتج برمز SKU أو الاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[var(--input-height)] ps-10 pe-4 rounded-lg border border-border bg-surface focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border",
                category === cat.id
                  ? "bg-text-primary text-white border-transparent"
                  : "bg-surface border-border text-text-secondary hover:border-accent hover:text-text-primary"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 content-start pb-24 lg:pb-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : products.length === 0 ? (
           <div className="text-center py-12 text-text-secondary">
             لا توجد منتجات مطابقة.
           </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * columns;
              const rowProducts = products.slice(startIndex, startIndex + columns);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '16px', // gap substitute
                  }}
                  className="flex gap-4"
                >
                  {rowProducts.map(product => (
                    <div key={product.id} style={{ width: `${100 / columns}%` }} className="h-full">
                      <ProductCard product={product} onAdd={() => addItem(product)} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd, key }: { product: Product; onAdd: () => void; key?: string }) {
  const isOutOfStock = product.track_stock && product.stock_qty <= 0;
  const isLowStock = product.track_stock && product.stock_qty > 0 && product.stock_qty <= product.min_stock;

  return (
    <div 
      onClick={() => { if (!isOutOfStock) onAdd() }}
      className={cn(
        "bg-surface border border-border rounded-xl p-3 flex flex-col justify-between transition-all select-none group h-[164px]",
        isOutOfStock ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:border-accent active:scale-[0.98]" // added border on hover
      )}
    >
      <div className="flex justify-between items-start gap-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 md:text-base">{product.name}</h3>
      </div>
      
      <div className="mt-auto pt-2">
        {product.track_stock && (
             <div className="text-[11px] mb-1">
                {isOutOfStock ? (
                  <span className="text-danger font-medium flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-danger"></span> نفذت الكمية
                  </span>
                ) : isLowStock ? (
                  <span className="text-warning font-medium flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-warning"></span> {product.stock_qty} متبقي
                  </span>
                ) : (
                   <span className="text-text-secondary">المتوفر: {product.stock_qty}</span>
                )}
             </div>
        )}
        <div className="flex items-end justify-between">
          <span className="numeric text-lg text-accent">{formatMoney(product.sale_price)}</span>
          <button 
            disabled={isOutOfStock}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent-light text-accent group-hover:bg-accent group-hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
