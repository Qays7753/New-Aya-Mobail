import React, { useState, useEffect, useRef } from 'react';
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
  { id: 'all',            label: 'الكل',          color: '#CF694A' },
  { id: 'device',         label: 'أجهزة',          color: '#2563EB' },
  { id: 'sim',            label: 'شرائح',          color: '#7C3AED' },
  { id: 'service_general',label: 'خدمات عامة',     color: '#0D9488' },
  { id: 'service_repair', label: 'خدمات صيانة',    color: '#EA7317' },
  { id: 'accessory',      label: 'إكسسوار',        color: '#D9A404' },
  { id: 'package',        label: 'باقات',          color: '#DB2777' },
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
  
  // Calculate columns based on container width
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    if (!parentRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w >= 1280) setColumns(5);
        else if (w >= 1024) setColumns(4);
        else if (w >= 768) setColumns(3);
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
    estimateSize: () => 178, // 168px card + 10px gap
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

        <div className="flex overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  backgroundColor: cat.color,
                  opacity: isActive ? 1 : 0.55,
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                  borderBottom: isActive ? '3px solid #fff' : '3px solid transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                }}
                className="flex-1 min-w-[80px] h-[60px] flex items-center justify-center whitespace-nowrap text-white font-bold rounded-t-lg transition-all"
                dir="rtl"
              >
                <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '15px', fontWeight: 700 }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
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
                    paddingBottom: '10px',
                  }}
                  className="flex gap-[10px]"
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
      style={{ touchAction: 'manipulation', userSelect: 'none', height: '168px' }}
      className={cn(
        "bg-surface border border-border rounded-xl flex flex-col select-none relative overflow-hidden",
        isOutOfStock ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:border-accent",
        isAnimating && "scale-[0.96] transition-transform duration-100",
        !isAnimating && "transition-all"
      )}
    >
      {/* Float +1 animations */}
      {floatPluses.map(fp => (
        <span
          key={fp.id}
          className="absolute z-10 text-[#CF694A] font-bold text-xl pointer-events-none animate-float-up"
          style={{ left: fp.x, top: fp.y, fontFamily: 'Inter' }}
        >
          +1
        </span>
      ))}

      {/* Image / Icon area — 88px */}
      <div className="h-[88px] w-full shrink-0 overflow-hidden rounded-t-xl">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: color.bg, color: color.text }}>
            <IconComponent size={40} opacity={0.85} />
          </div>
        )}
      </div>

      {/* Text area */}
      <div className="flex flex-col justify-between flex-1 px-2 pt-1 pb-2">
        <h3
          className="line-clamp-2 leading-tight text-text-primary"
          style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '13px', fontWeight: 600 }}
        >
          {product.name}
        </h3>

        <div className="flex items-end justify-between">
          {/* Low-stock badge */}
          <div className="flex flex-col gap-0.5">
            {product.track_stock && isOutOfStock && (
              <span className="flex items-center gap-0.5" style={{ fontSize: '10px', color: 'var(--color-danger)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />نفذت
              </span>
            )}
            {product.track_stock && isLowStock && (
              <span className="flex items-center gap-0.5" style={{ fontSize: '10px', color: 'var(--color-warning)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />{product.stock_qty}
              </span>
            )}
          </div>
          {/* Price */}
          <span
            className="numeric"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700, color: '#CF694A' }}
          >
            {formatMoney(product.sale_price)}
          </span>
        </div>
      </div>
    </div>
  );
}
