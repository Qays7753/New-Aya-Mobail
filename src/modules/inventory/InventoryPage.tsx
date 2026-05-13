import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllProducts, Product } from '@/db/queries/products';
import { restockProducts } from '@/db/queries/purchases';
import { getActiveAccounts } from '@/db/queries/accounts';
import { Minus, Plus, Search, CheckCircle, PackagePlus, AlertCircle } from 'lucide-react';
import { formatMoney, parseMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stockAdditions, setStockAdditions] = useState<Record<string, { qty: number, cost: string }>>({});
  const [supplier, setSupplier] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', search, 'all', false], // only active products
    queryFn: () => getAllProducts(search, 'all', false),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['active-accounts'],
    queryFn: getActiveAccounts,
  });

  // Default to first account if available
  if (accounts.length > 0 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].id);
  }

  const trackableProducts = products.filter(p => p.track_stock);

  const calculateTotalCost = () => {
    let total = 0;
    Object.values(stockAdditions as Record<string, { qty: number, cost: string }>).forEach(addition => {
      if (addition.qty > 0) {
        total += parseMoney(addition.cost);
      }
    });
    return total;
  };

  const totalCost = calculateTotalCost();
  const hasAdditions = Object.values(stockAdditions as Record<string, { qty: number, cost: string }>).some(a => a.qty > 0);

  const handleUpdateAddition = (productId: string, field: 'qty' | 'cost', value: any) => {
    setStockAdditions(prev => {
      const current = prev[productId] || { qty: 0, cost: '' };
      return {
        ...prev,
        [productId]: { ...current, [field]: value }
      };
    });
  };

  const restockMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(stockAdditions as Record<string, { qty: number, cost: string }>)
        .filter(([_, data]) => data.qty > 0)
        .map(([id, data]) => ({
          productId: id,
          quantity: data.qty,
          costPrice: parseMoney(data.cost)
        }));

      return restockProducts({
        items,
        supplierName: supplier,
        totalCost,
        paidAmount: totalCost, // Assuming paid in full for simplicity
        accountId: selectedAccountId
      });
    },
    onSuccess: () => {
      toast.success('تم توريد المخزون بنجاح');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['active-accounts'] });
      setStockAdditions({});
      setSupplier('');
    },
    onError: (err: any) => {
      toast.error('خطأ أثناء التوريد: ' + err.message);
    }
  });

  return (
    <div className="flex flex-col h-full bg-background relative isolate">
      <header className="bg-surface border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">توريد للمخزون</h1>
              <p className="text-sm text-text-secondary">إضافة كميات جديدة للمنتجات المتعقبة</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="ابحث عن صنف لإضافته للكميات..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Products List */}
        <main className="flex-1 overflow-y-auto p-4 bg-background">
          <div className="max-w-4xl mx-auto space-y-3">
            {isLoadingProducts ? (
              <div className="p-8 text-center"><div className="animate-spin w-8 h-8 mx-auto border-4 border-accent/30 border-t-accent rounded-full"></div></div>
            ) : trackableProducts.length === 0 ? (
              <div className="text-center p-8 bg-surface rounded-2xl border border-border">
                <p className="text-secondary">لا توجد منتجات متعقبة للمخزون تطابق بحثك.</p>
              </div>
            ) : (
              trackableProducts.map(product => {
                const isLowStock = product.stock_qty <= product.min_stock;
                const addition = stockAdditions[product.id] || { qty: 0, cost: '' };

                return (
                  <div key={product.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-text-secondary">المخزون الحالي:</span>
                        <span className={cn(
                          "font-bold numeric",
                          isLowStock ? "text-danger" : "text-success"
                        )}>
                          {product.stock_qty}
                        </span>
                        {isLowStock && <AlertCircle className="w-4 h-4 text-danger inline-block" />}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center bg-muted/30 p-2 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 bg-surface rounded-lg border border-border px-2">
                        <span className="text-xs text-text-secondary whitespace-nowrap">الكمية:</span>
                        <button 
                          onClick={() => handleUpdateAddition(product.id, 'qty', Math.max(0, addition.qty - 1))}
                          className="w-8 h-8 flex items-center justify-center hover:text-danger"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={addition.qty}
                          onChange={(e) => handleUpdateAddition(product.id, 'qty', parseInt(e.target.value) || 0)}
                          className="w-12 h-8 text-center font-bold bg-transparent outline-none numeric"
                        />
                        <button 
                          onClick={() => handleUpdateAddition(product.id, 'qty', addition.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:text-success"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="التكلفة الإجمالية"
                          value={addition.cost}
                          onChange={(e) => handleUpdateAddition(product.id, 'cost', e.target.value)}
                          className={cn(
                            "w-36 h-10 px-3 pl-8 rounded-lg border focus:ring-1 outline-none numeric font-bold",
                            addition.qty > 0 ? "border-accent focus:ring-accent bg-background" : "border-border bg-surface text-text-secondary"
                          )}
                          disabled={addition.qty === 0}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">د.ع</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Sidebar Summary */}
        <aside className="w-full lg:w-96 bg-surface border-t lg:border-t-0 lg:border-s border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border bg-background">
            <h2 className="font-bold text-lg">تفاصيل التوريد</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم المورد (اختياري)</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 h-11 rounded-lg border border-border bg-background focus:border-accent outline-none"
                placeholder="شركة الجوال للحاسبات..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">دفع من حساب</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 h-11 rounded-lg border border-border bg-background focus:border-accent outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatMoney(acc.balance)})</option>
                ))}
              </select>
            </div>

            <div className="bg-muted p-4 rounded-xl space-y-2 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">عدد الأصناف المضافة</span>
                <span className="font-bold numeric">{Object.values(stockAdditions as Record<string, {qty: number, cost: string}>).filter(a => a.qty > 0).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">إجمالي التكلفة</span>
                <span className="font-bold numeric text-danger">{formatMoney(totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-background border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              onClick={() => restockMutation.mutate()}
              disabled={!hasAdditions || !selectedAccountId || restockMutation.isPending}
              className="w-full h-[var(--btn-height)] bg-accent text-white font-bold rounded-lg disabled:opacity-50 hover:bg-accent-hover transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              تأكيد وحفظ
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
