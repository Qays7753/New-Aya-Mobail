import { describe, it, expect, beforeEach } from 'vitest';
import { calculateItemLineTotal, useCartStore } from '../cart.store';
import type { CartItem } from '../cart.store';
import type { Product } from '@/db/queries/products';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'منتج تجريبي',
    sku: null,
    category: 'device',
    sale_price: 1000,
    cost_price: 500,
    stock_qty: 10,
    min_stock: 2,
    track_stock: false,
    is_quick_add: false,
    is_active: true,
    notes: null,
    icon: 'Box',
    image_path: null,
    ...overrides,
  };
}

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    cartItemId: 'item1',
    product: makeProduct(),
    quantity: 1,
    discountType: 'amount',
    discountValue: 0,
    ...overrides,
  };
}

describe('calculateItemLineTotal', () => {
  it('no discount: total equals price × qty', () => {
    const result = calculateItemLineTotal(makeItem({ quantity: 3 }));
    expect(result.subtotal).toBe(3000);
    expect(result.discountAmt).toBe(0);
    expect(result.total).toBe(3000);
  });

  it('applies amount discount', () => {
    const result = calculateItemLineTotal(
      makeItem({ discountType: 'amount', discountValue: 200 })
    );
    expect(result.discountAmt).toBe(200);
    expect(result.total).toBe(800);
  });

  it('applies percent discount', () => {
    const result = calculateItemLineTotal(
      makeItem({ discountType: 'percent', discountValue: 10 })
    );
    expect(result.discountAmt).toBe(100);
    expect(result.total).toBe(900);
  });

  it('clamps discount so total never goes below 0', () => {
    const result = calculateItemLineTotal(
      makeItem({ discountType: 'amount', discountValue: 99999 })
    );
    expect(result.discountAmt).toBe(1000);
    expect(result.total).toBe(0);
  });

  it('uses overridePrice instead of product.sale_price', () => {
    const result = calculateItemLineTotal(makeItem({ overridePrice: 500 }));
    expect(result.subtotal).toBe(500);
    expect(result.total).toBe(500);
  });

  it('quantity 2 with percent discount', () => {
    const result = calculateItemLineTotal(
      makeItem({ quantity: 2, discountType: 'percent', discountValue: 50 })
    );
    expect(result.subtotal).toBe(2000);
    expect(result.discountAmt).toBe(1000);
    expect(result.total).toBe(1000);
  });
});

describe('CartStore computed values', () => {
  const baseState = {
    activeCartId: 'default' as const,
    items: [] as CartItem[],
    globalDiscountType: 'amount' as const,
    globalDiscountValue: 0,
    pulseTrigger: 0,
  };

  beforeEach(() => {
    useCartStore.setState(baseState);
  });

  it('getSubtotal returns 0 for empty cart', () => {
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it('getSubtotal sums all item totals', () => {
    useCartStore.setState({
      items: [
        makeItem({ cartItemId: 'a', product: makeProduct({ id: 'p1', sale_price: 1000 }), quantity: 2 }),
        makeItem({ cartItemId: 'b', product: makeProduct({ id: 'p2', sale_price: 500 }), quantity: 1 }),
      ],
    });
    expect(useCartStore.getState().getSubtotal()).toBe(2500);
  });

  it('getTotal returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotal()).toBe(0);
  });

  it('getTotal applies global amount discount', () => {
    useCartStore.setState({
      items: [makeItem({ cartItemId: 'a', quantity: 1 })],
      globalDiscountType: 'amount',
      globalDiscountValue: 100,
    });
    expect(useCartStore.getState().getTotal()).toBe(900);
  });

  it('getTotal applies global percent discount', () => {
    useCartStore.setState({
      items: [makeItem({ cartItemId: 'a', quantity: 1 })],
      globalDiscountType: 'percent',
      globalDiscountValue: 20,
    });
    expect(useCartStore.getState().getTotal()).toBe(800);
  });

  it('getTotalDiscount includes item-level and global discounts', () => {
    useCartStore.setState({
      items: [
        makeItem({
          cartItemId: 'a',
          quantity: 1,
          discountType: 'amount',
          discountValue: 100,
        }),
      ],
      globalDiscountType: 'amount',
      globalDiscountValue: 50,
    });
    expect(useCartStore.getState().getTotalDiscount()).toBe(150);
  });

  it('getTotal is never negative even with large discount', () => {
    useCartStore.setState({
      items: [makeItem({ cartItemId: 'a', quantity: 1 })],
      globalDiscountType: 'amount',
      globalDiscountValue: 99999,
    });
    expect(useCartStore.getState().getTotal()).toBe(0);
  });
});
