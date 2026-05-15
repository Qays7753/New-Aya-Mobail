import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Product } from '@/db/queries/products';
import { addMoney, subMoney, mulMoney, applyPercent } from '@/lib/money';
import { useSavedCartsStore } from './savedCarts.store';

export interface CartItem {
  cartItemId: string; // unique string for the item in cart
  product: Product;
  quantity: number;
  discountType: 'amount' | 'percent';
  discountValue: number; // in fils if amount, percentage if percent
}

interface CartState {
  activeCartId: string;
  items: CartItem[];
  globalDiscountType: 'amount' | 'percent';
  globalDiscountValue: number;
  pulseTrigger: number;
  
  addItem: (product: Product) => void;
  restoreItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  setItemDiscount: (cartItemId: string, type: 'amount' | 'percent', value: number) => void;
  setGlobalDiscount: (type: 'amount' | 'percent', value: number) => void;
  clearCart: () => void;
  switchToCart: (savedCartId: string) => void;
  saveAsNewCart: (title: string) => void;
  syncToSavedCart: () => void;
  
  getSubtotal: () => number;
  getTotalDiscount: () => number;
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      activeCartId: 'default',
      items: [],
      globalDiscountType: 'amount',
      globalDiscountValue: 0,
      pulseTrigger: 0,
      
      syncToSavedCart: () => {
        const state = get();
        if (state.activeCartId !== 'default') {
          useSavedCartsStore.getState().updateCart(state.activeCartId, state.items, state.globalDiscountType, state.globalDiscountValue);
        }
      },
      
      switchToCart: (savedCartId: string) => {
        // If switching to default (new cart mode essentially), clear
        if (savedCartId === 'default') {
          set({ activeCartId: 'default', items: [], globalDiscountType: 'amount', globalDiscountValue: 0 });
          return;
        }
        
        const savedCartsStore = useSavedCartsStore.getState();
        const cart = savedCartsStore.savedCarts.find(c => c.id === savedCartId);
        if (cart) {
          set({
            activeCartId: cart.id,
            items: [...cart.items],
            globalDiscountType: cart.globalDiscountType,
            globalDiscountValue: cart.globalDiscountValue
          });
        }
      },
      
      saveAsNewCart: (title: string) => {
        const state = get();
        const savedCartsStore = useSavedCartsStore.getState();
        const res = savedCartsStore.saveCart(title, state.items, state.globalDiscountType, state.globalDiscountValue);
        if (res.success && res.newCartId) {
            set({ activeCartId: res.newCartId });
        }
      },

      addItem: (product) => set((state) => {
        const nextPulse = state.pulseTrigger + 1;
        const existingIndex = state.items.findIndex(i => i.product.id === product.id && i.discountValue === 0);
        
        let newItems;
        if (existingIndex >= 0) {
          newItems = [...state.items];
          newItems[existingIndex].quantity += 1;
        } else {
          const newItem: CartItem = {
            cartItemId: nanoid(),
            product,
            quantity: 1,
            discountType: 'amount',
            discountValue: 0
          };
          newItems = [...state.items, newItem];
        }
        
        // Sync after state is returned: Wait, Zustand doesn't execute code *after* return, so we setTimeout
        setTimeout(() => get().syncToSavedCart(), 0);
        
        return { items: newItems, pulseTrigger: nextPulse };
      }),
      
      restoreItem: (item) => set((state) => {
        const nextPulse = state.pulseTrigger + 1;
        const newItems = [...state.items, item];
        setTimeout(() => get().syncToSavedCart(), 0);
        return { items: newItems, pulseTrigger: nextPulse };
      }),
      
      removeItem: (cartItemId) => set((state) => {
        setTimeout(() => get().syncToSavedCart(), 0);
        return { items: state.items.filter(i => i.cartItemId !== cartItemId) };
      }),
      
      updateQuantity: (cartItemId, qty) => set((state) => {
        setTimeout(() => get().syncToSavedCart(), 0);
        return { items: state.items.map(i => i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, qty) } : i) };
      }),
      
      setItemDiscount: (cartItemId, type, value) => set((state) => {
        setTimeout(() => get().syncToSavedCart(), 0);
        return { items: state.items.map(i => i.cartItemId === cartItemId ? { ...i, discountType: type, discountValue: Math.max(0, value) } : i) };
      }),
      
      setGlobalDiscount: (type, value) => {
        set({ globalDiscountType: type, globalDiscountValue: Math.max(0, value) });
        get().syncToSavedCart();
      },
      
      clearCart: () => {
        set({ items: [], globalDiscountType: 'amount', globalDiscountValue: 0 });
        get().syncToSavedCart();
      },
      
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
    }),
    {
      name: 'active_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        globalDiscountType: state.globalDiscountType,
        globalDiscountValue: state.globalDiscountValue
      }),
    }
  )
);
