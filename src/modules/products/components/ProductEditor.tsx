import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, addProduct, updateProduct, toggleProductActive } from '@/db/queries/products';
import { X, Save, Trash2, Power } from 'lucide-react';
import { formatMoney, parseMoney } from '@/lib/money';
import { toast } from 'sonner';

interface ProductEditorProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'device', name: 'أجهزة' },
  { id: 'accessory', name: 'إكسسوارات' },
  { id: 'sim', name: 'شرائح اتصال' },
  { id: 'package', name: 'باقات' },
  { id: 'service_repair', name: 'خدمات صيانة' },
  { id: 'service_general', name: 'خدمات عامة' }
];

export function ProductEditor({ product, isOpen, onClose }: ProductEditorProps) {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'device',
    sale_price: '',
    stock_qty: '0',
    min_stock: '0',
    track_stock: false,
    is_quick_add: false,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name,
          sku: product.sku || '',
          category: product.category,
          sale_price: (product.sale_price / 100).toString(),
          stock_qty: product.stock_qty.toString(),
          min_stock: product.min_stock.toString(),
          track_stock: product.track_stock,
          is_quick_add: product.is_quick_add,
          notes: product.notes || ''
        });
      } else {
        setFormData({
          name: '',
          sku: '',
          category: 'device',
          sale_price: '',
          stock_qty: '0',
          min_stock: '0',
          track_stock: true,
          is_quick_add: false,
          notes: ''
        });
      }
    }
  }, [isOpen, product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = {
        name: formData.name,
        sku: formData.sku || null,
        category: formData.category as any,
        sale_price: parseMoney(formData.sale_price),
        stock_qty: parseInt(formData.stock_qty) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        track_stock: formData.track_stock,
        is_quick_add: formData.is_quick_add,
        notes: formData.notes || null,
      };

      if (isEditing && product) {
        await updateProduct(product.id, dataToSave);
      } else {
        await addProduct(dataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEditing ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
      onClose();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      await toggleProductActive(product.id, !product.is_active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product?.is_active ? 'تم إيقاف المنتج' : 'تم تفعيل المنتج');
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right sm:border-l border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isEditing ? 'تعديل الصنف' : 'إضافة صنف جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">اسم الصنف <span className="text-danger">*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              placeholder="مثال: شاشة ايفون 13 برو"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رمز الباركود (SKU)</label>
              <input 
                type="text" 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="اختياري"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">التصنيف</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">سعر البيع <span className="text-danger">*</span></label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="decimal"
                value={formData.sale_price}
                onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none font-bold numeric text-lg pl-12"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">د.ع</span>
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">تتبع المخزون</h4>
                <p className="text-secondary text-xs">هل يجب حساب كمية هذا الصنف وتنبيهك؟</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.track_stock}
                  onChange={(e) => setFormData({...formData, track_stock: e.target.checked})}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            {formData.track_stock && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-2">الكمية الحالية</label>
                  <input 
                    type="number" 
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({...formData, stock_qty: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">حد النواقص</label>
                  <input 
                    type="number" 
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border border-border rounded-xl p-4">
            <div>
              <h4 className="font-medium">إضافة سريعة (POS)</h4>
              <p className="text-secondary text-xs">إظهار كزر سريع في شاشة نقاط البيع</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.is_quick_add}
                onChange={(e) => setFormData({...formData, is_quick_add: e.target.checked})}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">ملاحظات (اختياري)</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none h-24 resize-none"
            />
          </div>

        </div>

        <div className="p-4 border-t border-border bg-background flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !formData.name || !formData.sale_price}
            className="flex-1 h-[var(--btn-height)] bg-accent text-white font-bold rounded-lg disabled:opacity-50 hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            حفظ البيانات
          </button>
          
          {isEditing && (
             <button
              onClick={() => {
                if (window.confirm(`هل أنت متأكد من ${product.is_active ? 'إيقاف' : 'تفعيل'} هذا الصنف؟`)) {
                  toggleMutation.mutate();
                }
              }}
              className="px-4 h-[var(--btn-height)] bg-surface border border-border text-text-primary rounded-lg hover:bg-muted transition-colors flex justify-center items-center"
              title={product.is_active ? "إيقاف الصنف" : "تفعيل الصنف"}
            >
               <Power className={`w-5 h-5 ${product.is_active ? 'text-danger' : 'text-success'}`} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
