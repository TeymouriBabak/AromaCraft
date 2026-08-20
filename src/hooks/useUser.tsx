"use client";
import { useEffect, useState } from 'react';
import api, { ApiError } from '@/lib/api-client';

type AuthMeResponse = {
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    username?: string;
    mobile?: string;
    countryCode?: string;
    email?: string;
    role?: 'customer' | 'admin' | 'manager';
  } | null;
};

export function useUser() {
  const [user, setUser] = useState<AuthMeResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    api
      .get<AuthMeResponse>('/api/auth/me')
      .then((data) => {
        if (!mounted) return;
        setUser(data.user ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof ApiError ? err : new Error(String(err)));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return { user, loading, error, setUser } as const;
}

export default useUser;
