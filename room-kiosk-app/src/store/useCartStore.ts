import { create } from 'zustand';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  categoryId: number;
  slug?: string;
  discount_type?: 'None' | 'Percentage' | 'Fixed';
  discount_value?: number;
}

export function getDiscountedPrice(product: Product): number {
  if (!product.discount_type || product.discount_type === 'None') return product.price;
  const val = product.discount_value || 0;
  if (product.discount_type === 'Percentage') {
    return product.price * (1 - val / 100);
  }
  if (product.discount_type === 'Fixed') {
    return Math.max(0, product.price - val);
  }
  return product.price;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === product.id);
    if (existingItem) {
      set({
        items: items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.id !== productId) });
  },
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: quantity > 0
        ? state.items.map((i) => i.id === productId ? { ...i, quantity } : i)
        : state.items.filter((i) => i.id !== productId)
    })),
  clearCart: () => set({ items: [] }),
  totalAmount: () => get().items.reduce((total, item) => total + getDiscountedPrice(item) * item.quantity, 0),
}));
