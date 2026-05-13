import { create } from 'zustand';
import { Product } from '@/db/queries/products';
import { addMoney, subMoney, mulMoney, applyPercent } from '@/lib/money';

export interface CartItem {
  cartItemId: string; // unique string for the item in cart
  product: Product;
  quantity: number;
  discountType: 'amount' | 'percent';
  discountValue: number; // in fils if amount, percentage if percent
}

interface CartState {
  items: CartItem[];
  globalDiscountType: 'amount' | 'percent';
  globalDiscountValue: number;
  
  addItem: (product: Product) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  setItemDiscount: (cartItemId: string, type: 'amount' | 'percent', value: number) => void;
  setGlobalDiscount: (type: 'amount' | 'percent', value: number) => void;
  clearCart: () => void;
  
  getSubtotal: () => number;
  getTotalDiscount: () => number; // sum of item discounts + global discount
  getTotal: () => number;
}

function calculateItemLineTotal(item: CartItem): { subtotal: number, discountAmt: number, total: number } {
  const sub = mulMoney(item.product.sale_price, item.quantity);
  let dAmt = 0;
  if (item.discountType === 'amount') {
    dAmt = item.discountValue;
  } else {
    dAmt = applyPercent(sub, item.discountValue);
  }
  // Discount cannot exceed subtotal
  if (dAmt > sub) dAmt = sub;
  
  return { subtotal: sub, discountAmt: dAmt, total: subMoney(sub, dAmt) };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  globalDiscountType: 'amount',
  globalDiscountValue: 0,
  
  addItem: (product) => set((state) => {
    // Basic rules check: track_stock && stock_qty <= 0 is done at UI level ideally, 
    // but we can add check here if wanted. We'll simply let UI disable add buttons.
    
    // Check if product already exists without specific modifications
    const existingIndex = state.items.findIndex(i => i.product.id === product.id && i.discountValue === 0);
    
    if (existingIndex >= 0) {
      const newItems = [...state.items];
      newItems[existingIndex].quantity += 1;
      return { items: newItems };
    }
    
    const newItem: CartItem = {
      cartItemId: Math.random().toString(36).substring(7),
      product,
      quantity: 1,
      discountType: 'amount',
      discountValue: 0
    };
    
    return { items: [...state.items, newItem] };
  }),
  
  removeItem: (cartItemId) => set((state) => ({
    items: state.items.filter(i => i.cartItemId !== cartItemId)
  })),
  
  updateQuantity: (cartItemId, qty) => set((state) => ({
    items: state.items.map(i => i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, qty) } : i)
  })),
  
  setItemDiscount: (cartItemId, type, value) => set((state) => ({
    items: state.items.map(i => i.cartItemId === cartItemId ? { ...i, discountType: type, discountValue: Math.max(0, value) } : i)
  })),
  
  setGlobalDiscount: (type, value) => set({ globalDiscountType: type, globalDiscountValue: Math.max(0, value) }),
  
  clearCart: () => set({ items: [], globalDiscountType: 'amount', globalDiscountValue: 0 }),
  
  getSubtotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => addMoney(sum, mulMoney(item.product.sale_price, item.quantity)), 0);
  },
  
  getTotalDiscount: () => {
    const state = get();
    // Item discounts
    const itemsDiscount = state.items.reduce((sum, item) => addMoney(sum, calculateItemLineTotal(item).discountAmt), 0);
    
    const itemsTotal = state.items.reduce((sum, item) => addMoney(sum, calculateItemLineTotal(item).total), 0);
    
    // Global discount
    let globalDiscountAmt = 0;
    if (state.globalDiscountType === 'amount') {
      globalDiscountAmt = state.globalDiscountValue;
    } else {
      globalDiscountAmt = applyPercent(itemsTotal, state.globalDiscountValue);
    }
    
    if (globalDiscountAmt > itemsTotal) globalDiscountAmt = itemsTotal;
    
    return addMoney(itemsDiscount, globalDiscountAmt);
  },
  
  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const totalDiscount = state.getTotalDiscount();
    return Math.max(0, subMoney(subtotal, totalDiscount));
  }
}));
