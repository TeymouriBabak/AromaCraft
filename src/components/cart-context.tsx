'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { products } from '@/data/products';
import type { Product } from '@/data/products';

type CartItem = {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  grindType?: string;
  size?: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  isUpdating: boolean;
  hasHydrated: boolean;
  addItem: (input: {
    productId: number;
    quantity?: number;
    name?: string;
    price?: number;
    image?: string;
    grindType?: string;
    size?: string;
  }) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'aromacraft-cart';

function getProductById(productId: number): Product | undefined {
  return products.find((product) => product.id === productId);
}

function normalizeQuantity(quantity: number) {
  const parsed = Number(quantity);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        try {
          const next = event.newValue
            ? (JSON.parse(event.newValue) as unknown)
            : null;
          if (Array.isArray(next)) {
            // sanitize and accept (defer to avoid sync setState in effect)
            const sanitized = sanitizeCartItems(next as unknown[]);
            setTimeout(() => setItems(sanitized), 0);
          }
        } catch {
          // ignore invalid storage
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Read persisted cart once on mount (hydrate)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeCartItems(parsed as unknown[]);
          setTimeout(() => setItems(sanitized), 0);
        }
      }
    } catch {
      // ignore
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Persist only after hydration to avoid overwriting server-rendered state
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage failures
    }
  }, [items, hasHydrated]);

  const addItem = useCallback(
    (input: {
      productId: number;
      quantity?: number;
      name?: string;
      price?: number;
      image?: string;
      grindType?: string;
      size?: string;
    }) => {
      const nextQuantity = normalizeQuantity(input.quantity ?? 1);
      if (!nextQuantity) {
        return;
      }

      setIsUpdating(true);

      const product = getProductById(input.productId);
      setItems((current) => {
        const existing = current.find(
          (item) => item.productId === input.productId
        );
        if (existing) {
          const stockLimit = product ? 10 : 20;
          const updatedQuantity = Math.min(
            existing.quantity + nextQuantity,
            stockLimit
          );
          return current.map((item) =>
            item.productId === input.productId
              ? { ...item, quantity: updatedQuantity }
              : item
          );
        }

        const fallbackName = product?.name ?? input.name ?? 'Selected coffee';
        const fallbackPrice = product?.price ?? input.price ?? 0;
        return [
          ...current,
          {
            id: input.productId,
            productId: input.productId,
            name: fallbackName,
            price: fallbackPrice,
            quantity: Math.min(nextQuantity, product ? 10 : 20),
            image: input.image ?? product?.image,
            grindType: input.grindType,
            size: input.size,
          },
        ];
      });
      setIsOpen(true);
      setTimeout(() => setIsUpdating(false), 350);
    },
    []
  );

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    const normalized = normalizeQuantity(quantity);
    setIsUpdating(true);
    setItems((current) => {
      if (normalized <= 0) {
        return current.filter((item) => item.productId !== productId);
      }

      const product = getProductById(productId);
      const stockLimit = product ? 10 : 20;
      const boundedQuantity = Math.min(normalized, stockLimit);
      return current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: boundedQuantity }
          : item
      );
    });
    setTimeout(() => setIsUpdating(false), 350);
  }, []);

  const removeItem = useCallback((productId: number) => {
    setIsUpdating(true);
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
    setTimeout(() => setIsUpdating(false), 350);
  }, []);

  const clearCart = useCallback(() => {
    setIsUpdating(true);
    setItems([]);
    setTimeout(() => setIsUpdating(false), 250);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const shipping = subtotal > 0 ? (subtotal >= 50 ? 0 : 6) : 0;
  const total = subtotal + shipping;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      shipping,
      total,
      isUpdating,
      hasHydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((current) => !current),
    }),
    [
      addItem,
      clearCart,
      isOpen,
      itemCount,
      items,
      removeItem,
      shipping,
      subtotal,
      total,
      updateQuantity,
      isUpdating,
      hasHydrated,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Simple sanitizer for persisted cart items to avoid invalid shapes causing runtime issues
function sanitizeCartItems(raw: unknown[]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const obj = it as Record<string, unknown>;
      const productId = Number(obj['productId'] as unknown);
      const quantity = Number(obj['quantity'] as unknown);
      const price = Number(obj['price'] as unknown);
      const name =
        typeof obj['name'] === 'string' ? (obj['name'] as string) : '';
      if (
        !Number.isFinite(productId) ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price)
      )
        return null;
      return {
        id: Number(obj['id'] as unknown) || productId,
        productId: productId,
        name,
        price: Math.max(0, price),
        quantity: Math.max(1, Math.floor(quantity)),
        image:
          typeof obj['image'] === 'string'
            ? (obj['image'] as string)
            : undefined,
        grindType:
          typeof obj['grindType'] === 'string'
            ? (obj['grindType'] as string)
            : undefined,
        size:
          typeof obj['size'] === 'string' ? (obj['size'] as string) : undefined,
      } as CartItem;
    })
    .filter(Boolean) as CartItem[];
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
