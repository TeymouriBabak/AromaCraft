"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type WishlistContextValue = {
  itemIds: number[];
  count: number;
  hasHydrated: boolean;
  hasItem: (productId: number) => boolean;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  toggleWishlist: (productId: number) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "aromacraft-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [itemIds, setItemIds] = useState<number[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((id) => typeof id === 'number');
          setTimeout(() => setItemIds(filtered), 0);
        }
      }
    } catch {
      // ignore
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itemIds));
    } catch {
      // ignore storage failures
    }
  }, [itemIds, hasHydrated]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        try {
          const next = event.newValue ? JSON.parse(event.newValue) : null;
          if (Array.isArray(next)) setItemIds(next.filter((id) => typeof id === 'number'));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addToWishlist = useCallback((productId: number) => {
    setItemIds((current) => (current.includes(productId) ? current : [...current, productId]));
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setItemIds((current) => current.filter((id) => id !== productId));
  }, []);

  const toggleWishlist = useCallback((productId: number) => {
    setItemIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
  }, []);

  const clearWishlist = useCallback(() => {
    setItemIds([]);
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      itemIds,
      count: itemIds.length,
      hasHydrated,
      hasItem: (productId: number) => itemIds.includes(productId),
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [addToWishlist, clearWishlist, hasHydrated, itemIds, removeFromWishlist, toggleWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
