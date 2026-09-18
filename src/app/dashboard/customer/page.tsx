'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Award, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import api from '@/lib/api-client';
import { Kpi, Panel, EmptyState } from '@/components/dashboard';

interface CustomerOverview {
  welcome?: string;
  orderCount?: number;
  totalSpent?: number;
  loyaltyTier?: string;
  lastOrderDate?: string;
  nextReward?: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<CustomerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['customer', 'admin', 'manager'].includes(user.role ?? ''))) {
      router.replace('/login');
      return;
    }

    if (!authLoading && user) {
      void (async () => {
        try {
          const data = await api.get<{ overview: CustomerOverview }>(
            '/api/dashboard/customer/overview'
          );
          setOverview(data?.overview ?? null);
        } catch (err) {
          console.error('Failed to fetch customer overview:', err);
          setError('Unable to load your overview.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="p-6 text-sm text-slate-400">Loading your account...</div>
    );
  }

  if (!user || !['customer', 'admin', 'manager'].includes(user.role ?? '')) {
    return (
      <div className="p-6 text-sm text-red-400">
        You do not have access to this dashboard.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load dashboard"
          description={error}
        />
      </div>
    );
  }

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.username;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          {overview?.welcome || `Welcome, ${displayName || 'Customer'}!`}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your orders, addresses, and account settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total Orders"
          value={overview?.orderCount ?? 0}
          icon={ShoppingBag}
          color="#0ea5e9"
        />
        <Kpi
          label="Amount Spent"
          value={`$${(overview?.totalSpent ?? 0).toLocaleString()}`}
          icon={Award}
          color="#10b981"
        />
        <Kpi
          label="Loyalty Tier"
          value={overview?.loyaltyTier || 'Bronze'}
          icon={Award}
          color="#f59e0b"
        />
        {overview?.lastOrderDate && (
          <Kpi
            label="Last Order"
            value={new Date(overview.lastOrderDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            icon={Calendar}
            color="#8b5cf6"
          />
        )}
      </div>

      <Panel
        title="Your Account"
        description="Quick access to your account features"
      >
        <div className="mt-4 space-y-3">
          <motion.a
            href="/dashboard/customer?section=Order%20History"
            className="block rounded-lg border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-sky-300 transition-colors hover:bg-sky-400/20"
            whileHover={{ x: 4 }}
          >
            → View your orders
          </motion.a>
          <motion.a
            href="/dashboard/customer?section=Saved%20Addresses"
            className="block rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300 transition-colors hover:bg-emerald-400/20"
            whileHover={{ x: 4 }}
          >
            → Manage addresses
          </motion.a>
          <motion.a
            href="/dashboard/customer?section=My%20Reviews"
            className="block rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-300 transition-colors hover:bg-amber-400/20"
            whileHover={{ x: 4 }}
          >
            → Your reviews
          </motion.a>
        </div>
      </Panel>

      {overview?.nextReward && (
        <Panel
          title="Next Reward"
          description={`${overview.nextReward} · Keep shopping to earn more!`}
        >
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((overview?.totalSpent ?? 0) / 500, 1) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400">
            ${(overview?.totalSpent ?? 0).toLocaleString()} / $500 to Gold tier
          </div>
        </Panel>
      )}
    </div>
  );
}
