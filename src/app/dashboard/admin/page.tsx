'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import api from '@/lib/api-client';
import { Kpi, Panel, EmptyState } from '@/components/dashboard';

interface AdminOverview {
  todayOrders?: number;
  todayRevenue?: number;
  pendingOrders?: number;
  openRefunds?: number;
  lowStockCount?: number;
  totalOrders?: number;
  totalRevenue?: number;
}

const adminSectionRegistry: Record<string, { title: string; endpoint?: string }> = {
  Today: { title: 'Today', endpoint: '/api/dashboard/admin/overview' },
  Metrics: { title: 'Metrics', endpoint: '/api/dashboard/admin/overview' },
  'All Orders': { title: 'All Orders', endpoint: '/api/dashboard/admin/orders' },
  Pending: { title: 'Pending Orders', endpoint: '/api/dashboard/admin/orders?status=PENDING' },
  Processing: { title: 'Processing Orders', endpoint: '/api/dashboard/admin/orders?status=PROCESSING' },
  Completed: { title: 'Completed Orders', endpoint: '/api/dashboard/admin/orders?status=DELIVERED' },
  Cancelled: { title: 'Cancelled Orders', endpoint: '/api/dashboard/admin/orders?status=CANCELLED' },
  'Product List': { title: 'Product List', endpoint: '/api/dashboard/admin/inventory' },
  'Low Stock Alerts': { title: 'Low Stock Alerts', endpoint: '/api/dashboard/admin/inventory?lowStock=true' },
  'Customer List': { title: 'Customer List', endpoint: '/api/dashboard/admin/users?role=CUSTOMER' },
};

function AdminSectionView({ section }: { section: string }) {
  const config = adminSectionRegistry[section];
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config?.endpoint) return;
    void api.get<Record<string, unknown>>(config.endpoint).then(setPayload).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Unable to load this section.');
    });
  }, [config?.endpoint]);

  if (!config) {
    return <EmptyState icon={AlertTriangle} title="Section unavailable" description={`No admin data source is registered for ${section}.`} />;
  }
  if (error) return <EmptyState icon={AlertTriangle} title="Unable to load section" description={error} />;
  if (!payload) return <div className="p-6 text-sm text-slate-400">Loading {config.title}...</div>;

  const rows = Object.values(payload).find((value) => Array.isArray(value)) as unknown[] | undefined;
  return (
    <Panel title={config.title} description="Live data from the admin API">
      {rows?.length ? (
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><tbody>
          {rows.map((row, index) => <tr key={index} className="border-b border-slate-700/70"><td className="px-4 py-3 text-slate-300">{typeof row === 'object' ? JSON.stringify(row) : String(row)}</td></tr>)}
        </tbody></table></div>
      ) : <div className="mt-4 text-sm text-slate-400">No records returned by the live database query.</div>}
    </Panel>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      router.replace('/dashboard/customer');
      return;
    }

    if (!authLoading && user) {
      void (async () => {
        try {
          const data = await api.get<{ overview: AdminOverview }>(
            '/api/dashboard/admin/overview'
          );
          setOverview(data?.overview ?? null);
        } catch (err) {
          console.error('Failed to fetch admin overview:', err);
          setError('Unable to load admin overview.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="p-6 text-sm text-slate-400">Loading admin dashboard...</div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
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

  const activeSection = searchParams?.get('section');
  if (activeSection) {
    return <div className="space-y-6 p-6"><AdminSectionView section={activeSection} /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage orders, products, customers, and store operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Today's Orders"
          value={overview?.todayOrders ?? 0}
          icon={ShoppingBag}
          color="#0ea5e9"
        />
        <Kpi
          label="Today's Revenue"
          value={`$${(overview?.todayRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="#10b981"
          trend="+12%"
        />
        <Kpi
          label="Pending Orders"
          value={overview?.pendingOrders ?? 0}
          icon={AlertTriangle}
          color="#f59e0b"
        />
        <Kpi
          label="Low Stock Items"
          value={overview?.lowStockCount ?? 0}
          icon={Package}
          color="#ef4444"
        />
      </div>

      <Panel
        title="Quick Stats"
        description="Your store's overall performance"
      >
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Total Orders
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {overview?.totalOrders ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Total Revenue
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              ${(overview?.totalRevenue ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Open Refunds
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {overview?.openRefunds ?? 0}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Getting Started"
        description="Navigate using the sidebar to manage your store"
      >
        <div className="mt-4 space-y-2">
          <motion.a
            href="/dashboard/admin?section=All%20Orders"
            className="block rounded-lg border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-sky-300 transition-colors hover:bg-sky-400/20"
            whileHover={{ x: 4 }}
          >
            → View all orders
          </motion.a>
          <motion.a
            href="/dashboard/admin?section=Product%20List"
            className="block rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300 transition-colors hover:bg-emerald-400/20"
            whileHover={{ x: 4 }}
          >
            → Manage products
          </motion.a>
          <motion.a
            href="/dashboard/admin?section=Customer%20List"
            className="block rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-300 transition-colors hover:bg-amber-400/20"
            whileHover={{ x: 4 }}
          >
            → View customers
          </motion.a>
        </div>
      </Panel>
    </div>
  );
}
