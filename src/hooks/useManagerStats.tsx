"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api-client';

type ManagerOverview = {
  totalUsers: number;
  totalCustomers: number;
  totalAdmins: number;
  newUsersThisMonth: number;
};

type ManagerStatsResponse = { overview: ManagerOverview };

export function useManagerStats() {
  const [data, setData] = useState<ManagerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    api
      .get<ManagerStatsResponse>('/api/manager/overview')
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch((e) => {
        if (mounted) setError(e);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return { data, loading, error } as const;
}

export default useManagerStats;
