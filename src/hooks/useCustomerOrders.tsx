"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api-client';

type ApiOrderItem = {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice?: number | string;
  product?: { id?: string; name?: string; imageUrl?: string; slug?: string } | null;
  name?: string;
  price?: number | string;
  size?: string;
  grindType?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  total: number;
  items: Array<{ productId: string; quantity: number; name: string; price: number; size?: string; grindType?: string }>;
};

type CustomerOrdersResponse = {
  orders?: Array<{
    id: string;
    createdAt: string | Date;
    total?: number | string;
    items?: ApiOrderItem[];
  }>;
};

export function useCustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    api
      .get<CustomerOrdersResponse>('/api/orders')
      .then((data) => {
        if (!mounted) return;
        const nextOrders = (data.orders ?? []).map((order) => ({
          id: order.id,
          createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
          total: Number(order.total ?? 0),
          items: (order.items ?? []).map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity ?? 0),
            name: item.name ?? item.product?.name ?? 'AromaCraft item',
            price: Number(item.price ?? item.unitPrice ?? 0),
            size: item.size,
            grindType: item.grindType,
          })),
        }));
        setOrders(nextOrders);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { orders, loading, error } as const;
}

export default useCustomerOrders;
