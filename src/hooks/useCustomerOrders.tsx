"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api-client';
import type { Order } from '@/lib/order-store';

type CustomerOrdersResponse = {
  orders: Order[];
};

export function useCustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    api
      .get<CustomerOrdersResponse>('/api/orders')
      .then((data) => {
        if (!mounted) return;
        setOrders(data.orders ?? []);
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
      controller.abort();
    };
  }, []);

  return { orders, loading, error } as const;
}

export default useCustomerOrders;
