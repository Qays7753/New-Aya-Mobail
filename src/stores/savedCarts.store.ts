import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './cart.store';
import { nanoid } from 'nanoid';

export interface SavedCart {
  id: string;
  name: string;
  createdAt: number;
  items: CartItem[];
  globalDiscountType: 'amount' | 'percent';
  globalDiscountValue: number;
}

interface SavedCartsState {
  savedCarts: SavedCart[];
  saveCart: (name: string, items: CartItem[], globalDiscountType: 'amount' | 'percent', globalDiscountValue: number) => { success: boolean; error?: string; newCartId?: string };
  updateCart: (id: string, items: CartItem[], globalDiscountType: 'amount' | 'percent', globalDiscountValue: number) => void;
  restoreCart: (id: string, cartStore: any) => void;
  deleteCart: (id: string) => void;
}

export const useSavedCartsStore = create<SavedCartsState>()(
  persist(
    (set, get) => ({
      savedCarts: [],
      
      saveCart: (name, items, globalDiscountType, globalDiscountValue) => {
        const { savedCarts } = get();
        if (savedCarts.length >= 3) {
          return { success: false, error: 'تم الوصول للحد الأقصى (3 سلات)' };
        }
        
        const newCart: SavedCart = {
          id: nanoid(),
          name: name.substring(0, 30),
          createdAt: Date.now(),
          items: [...items],
          globalDiscountType,
          globalDiscountValue
        };
        
        set({ savedCarts: [...savedCarts, newCart] });
        return { success: true, newCartId: newCart.id };
      },
      
      updateCart: (id, items, globalDiscountType, globalDiscountValue) => {
        set(state => ({
          savedCarts: state.savedCarts.map(c => c.id === id ? { ...c, items: [...items], globalDiscountType, globalDiscountValue } : c)
        }));
      },
      
      restoreCart: (id, cartStore) => {
        const cart = get().savedCarts.find(c => c.id === id);
        if (cart) {
          cartStore.setState({
            items: [...cart.items],
            globalDiscountType: cart.globalDiscountType,
            globalDiscountValue: cart.globalDiscountValue
          });
          get().deleteCart(id);
        }
      },
      
      deleteCart: (id) => {
        set(state => ({
          savedCarts: state.savedCarts.filter(c => c.id !== id)
        }));
      }
    }),
    {
      name: 'pos_saved_carts',
    }
  )
);
