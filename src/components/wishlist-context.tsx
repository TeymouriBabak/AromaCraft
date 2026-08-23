'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/components/auth-context';

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

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractProductIds(data: unknown): number[] {
  if (
    data &&
    typeof data === 'object' &&
    'productIds' in data &&
    Array.isArray((data as { productIds: unknown }).productIds)
  ) {
    return (data as { productIds: unknown[] }).productIds.filter(
      (id): id is number => typeof id === 'number'
    );
  }
  return [];
}

async function fetchServerProductIds(): Promise<number[] | null> {
  const res = await fetch('/api/wishlist').catch(() => null);
  if (!res?.ok) return null;
  return extractProductIds(await readJson(res));
}

function syncAdd(productId: number) {
  void fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  }).catch(() => {});
}

function syncRemove(productId: number) {
  void fetch(`/api/wishlist?productId=${productId}`, {
    method: 'DELETE',
  }).catch(() => {});
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [itemIds, setItemIds] = useState<number[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  const itemIdsRef = useRef<number[]>([]);
  const userIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    itemIdsRef.current = itemIds;
  }, [itemIds]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;

    let cancelled = false;

    void (async () => {
      if (!currentUserId) {
        if (!cancelled) {
          if (prevUserId) setItemIds([]);
          setHasHydrated(true);
        }
        return;
      }

      const guestIds = itemIdsRef.current;
      let serverIds: number[] | null = null;

      if (!prevUserId && guestIds.length > 0) {
        const res = await fetch('/api/wishlist/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: guestIds }),
        }).catch(() => null);
        if (res?.ok) {
          serverIds = extractProductIds(await readJson(res));
        }
      }

      if (serverIds === null) {
        serverIds = await fetchServerProductIds();
      }

      if (!cancelled) {
        if (serverIds !== null) setItemIds(serverIds);
        setHasHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id]);

  const addToWishlist = useCallback((productId: number) => {
    setItemIds((prev) =>
      prev.includes(productId) ? prev : [productId, ...prev]
    );
    if (userIdRef.current) syncAdd(productId);
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setItemIds((prev) => prev.filter((id) => id !== productId));
    if (userIdRef.current) syncRemove(productId);
  }, []);

  const toggleWishlist = useCallback(
    (productId: number) => {
      if (itemIdsRef.current.includes(productId)) {
        removeFromWishlist(productId);
      } else {
        addToWishlist(productId);
      }
    },
    [addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    const ids = itemIdsRef.current;
    setItemIds([]);
    if (userIdRef.current) ids.forEach(syncRemove);
  }, []);

  const hasItem = useCallback(
    (productId: number) => itemIds.includes(productId),
    [itemIds]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      itemIds,
      count: itemIds.length,
      hasHydrated,
      hasItem,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [
      itemIds,
      hasHydrated,
      hasItem,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
