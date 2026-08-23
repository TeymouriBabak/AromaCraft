'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api-client';

type CustomerOverviewPayload = {
  welcome?: string;
  loyaltyTier?: string;
  nextReward?: string;
  pointsBalance?: number;
};

type CustomerOverviewResponse = CustomerOverviewPayload & {
  overview?: CustomerOverviewPayload;
};

export function useCustomerOverview() {
  const [data, setData] = useState<CustomerOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    api
      .get<CustomerOverviewResponse>('/api/dashboard/customer/overview')
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

export default useCustomerOverview;
