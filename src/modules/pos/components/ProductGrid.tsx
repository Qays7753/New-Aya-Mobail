import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getActiveProducts, Product } from '@/db/queries/products';
import { useCartStore } from '@/stores/cart.store';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { loadProductImage } from '@/lib/imageStorage';
import { useDebounce } from '@/hooks/useDebounce';

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
  const debouncedSearch = useDebounce(search, 150);
  const [category, setCategory] = useState('all');
  const { addItem } = useCartStore();

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
        if (width >= 1024) setColumns(3); // lg
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
    estimateSize: () => 216, // estimated height of card + gap
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
                    paddingBottom: '12px', // gap substitute
                  }}
                  className="flex gap-3"
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

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void; }) {
  const isOutOfStock = product.track_stock && product.stock_qty <= 0;
  const isLowStock = product.track_stock && product.stock_qty > 0 && product.stock_qty <= product.min_stock;
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatPluses, setFloatPluses] = useState<{ id: number; x: number; y: number }[]>([]);
  const floatIdCounter = useRef(0);
  const lastTapTime = useRef(0);

  useEffect(() => {
    let active = true;
    if (product.image_path) {
      loadProductImage(product.image_path).then(url => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => { active = false; };
  }, [product.image_path]);

  const categoryColors: Record<string, { bg: string, text: string }> = {
    device:           { bg: '#E8EEF6', text: '#1E40AF' },
    sim:              { bg: '#F0EAF6', text: '#5B21B6' },
    service_general:  { bg: '#EEF6EA', text: '#166534' },
    service_repair:   { bg: '#FCF4F1', text: '#CF694A' },
    accessory:        { bg: '#F6F2E8', text: '#854D0E' },
    package:          { bg: '#F6E8E8', text: '#991B1B' },
    default:          { bg: '#F3F1EC', text: '#6D6A62' }
  };
  const color = categoryColors[product.category as string] || categoryColors.default;
  const IconComponent = (LucideIcons as any)[product.icon || 'Box'] || LucideIcons.Box;

  const handleClick = (e: React.MouseEvent) => {
    if (isOutOfStock) return;
    const now = Date.now();
    if (now - lastTapTime.current < 80) return;
    lastTapTime.current = now;

    onAdd();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 100);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = floatIdCounter.current++;
    setFloatPluses(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFloatPluses(prev => prev.filter(p => p.id !== id));
    }, 600);
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "bg-surface border border-border rounded-xl p-3 flex flex-col justify-between select-none group h-[204px] relative overflow-hidden",
        isOutOfStock ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:border-accent",
        isAnimating && "scale-[0.96] transition-transform duration-100",
        !isAnimating && "transition-all"
      )}
    >
      {floatPluses.map(fp => (
        <span 
          key={fp.id}
          className="absolute z-10 text-[#CF694A] font-bold text-xl pointer-events-none animate-float-up"
          style={{ left: fp.x, top: fp.y, fontFamily: 'Inter' }}
        >
          +1
        </span>
      ))}
      <div className="flex flex-col gap-2">
        <div className="h-[100px] w-full rounded-md overflow-hidden bg-muted relative">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: color.bg, color: color.text }}>
              <IconComponent size={56} opacity={0.8} />
            </div>
          )}
        </div>
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
            <LucideIcons.Plus className="w-5 h-5"/>
          </button>
        </div>
      </div>
    </div>
  );
}
