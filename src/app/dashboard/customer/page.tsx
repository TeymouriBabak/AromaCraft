'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import useCustomerOverview from '@/hooks/useCustomerOverview';
import useCustomerOrders from '@/hooks/useCustomerOrders';
import { useCart } from '@/components/cart-context';
import Skeleton from '@/components/Skeleton';
import variants from '@/lib/motion-variants';
import { formatCurrency } from '@/lib/currency';

type ActivityChartItem = { hour: string; minutes: number };
type MonthlyActivityItem = { month: string; actions: number };

type ActivityResponse = {
  activity?: Array<{ id: string; title: string; date: string }>; 
  charts?: { hourly?: ActivityChartItem[]; monthly?: MonthlyActivityItem[] };
  summary?: { totalActions?: number; averageMinutes?: number };
};

export default function CustomerDashboard() {
  const router = useRouter();
  const { data, loading, error } = useCustomerOverview();
  const { orders, loading: ordersLoading, error: ordersError } = useCustomerOrders();
  const { addItem } = useCart();
  const overview = data?.overview || data;
  const reduceMotion = useReducedMotion();
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/dashboard/customer/activity', { credentials: 'include' })
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;
        setActivityData(payload?.data ?? payload ?? null);
      })
      .finally(() => {
        // no-op; we keep activity data updated and avoid unused loading flag
      });

    return () => { mounted = false; };
  }, []);

  const hourlyChart = activityData?.charts?.hourly ?? [];
  const monthlyChart = activityData?.charts?.monthly ?? [];

  const handleReorder = useCallback(
    (orderId: string) => {
      const order = orders.find((item) => item.id === orderId);
      if (!order) return;

      order.items.forEach((item) => {
        const productId = Number(item.productId);
        if (!Number.isFinite(productId) || productId <= 0) return;

        addItem({
          productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          size: item.size,
          grindType: item.grindType,
        });
      });

      router.push('/checkout');
    },
    [orders, addItem, router],
  );

  if (loading) {
    return <div className="text-sm text-[#6e4b33]"><Skeleton rows={3} /></div>;
  }

  if (error) {
    return <div className="text-sm text-[#b56e3b]">Unable to load overview right now.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customer Dashboard</h2>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e9e1d6] bg-[#fdf9f2] p-4 text-sm text-[#2C1D11]">
        <div className="font-semibold">{overview?.welcome || 'Welcome back to your profile.'}</div>
        <div className="mt-1 text-[#6e4b33]">Loyalty tier: {overview?.loyaltyTier || 'Standard'} · Next reward: {overview?.nextReward || 'Check your next order'} · Points: {overview?.pointsBalance || 0}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <motion.div className="rounded-2xl bg-white p-4 shadow" initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} variants={variants.fadeUp}>
          <h3 className="text-sm font-medium">Activity Minutes by Hour</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={hourlyChart.length ? hourlyChart : [{ hour: '00:00', minutes: 0 }] }>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a373" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1A120B" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="minutes" stroke="#1A120B" fill="url(#colorSpent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="rounded-2xl bg-white p-4 shadow" initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} variants={variants.fadeUp}>
          <h3 className="text-sm font-medium">Actions this quarter</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyChart.length ? monthlyChart : [{ month: 'Jan', actions: 0 }] }>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="actions" fill="#c9854d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium">Purchase History</h3>
            <p className="mt-2 text-sm text-[#6e4b33]">Your recent orders and reorder actions are shown here.</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {ordersLoading ? (
            <Skeleton rows={6} />
          ) : ordersError ? (
            <div className="rounded-2xl border border-[#e76f51]/20 bg-[#fff1ef] p-4 text-sm text-[#b74930]">Unable to load orders right now.</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-[#d4a373]/20 bg-[#fbf7f2] p-6 text-sm text-[#6e4b33]">No orders found yet. Once you place an order, it will appear here.</div>
          ) : (
            <table className="w-full min-w-180 table-auto text-sm text-[#6e4b33]">
              <thead>
                <tr className="text-left text-[#6e4b33]">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-[#e9e1d6]">
                    <td className="py-3 font-semibold text-[#1a0f0a]">
                      <code className="font-mono text-xs">{order.id}</code>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleReorder(order.id)}
                        className="rounded-full bg-[#e76f51] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c9854d]"
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
