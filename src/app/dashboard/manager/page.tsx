'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useManagerStats from '@/hooks/useManagerStats';

const revenueData = Array.from({ length: 12 }).map((_, i) => ({ month: `M${i + 1}`, revenue: Math.round(Math.random() * 10000 + 2000), target: Math.round(8000 + Math.random() * 3000) }));
const brandShare = [
  { name: 'AromaCraft', value: 45 },
  { name: 'Starbucks', value: 22 },
  { name: "Gloria Jean's", value: 12 },
  { name: 'Tim Hortons', value: 8 },
  { name: 'Others', value: 13 },
];
const COLORS = ['#d4a373', '#1A120B', '#c9854d', '#2c1d11', '#f4c36b'];

export default function ManagerDashboard() {
  const { data, loading, error } = useManagerStats();
  const overview = data?.overview || data;

  if (loading) {
    return <div className="text-sm text-[#6e4b33]">Loading manager overview…</div>;
  }

  if (error) {
    return <div className="text-sm text-[#b56e3b]">Unable to load manager metrics right now.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Manager Dashboard</h2>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e9e1d6] bg-[#fdf9f2] p-4 text-sm text-[#2C1D11]">
        <div className="font-semibold">Manager snapshot</div>
        <div className="mt-1 text-[#6e4b33]">Pending orders: {overview?.pendingOrders || 0} · Revenue this week: {overview?.revenueThisWeek || 0} · Inventory alerts: {overview?.inventoryAlerts || 0} · Response rate: {overview?.teamResponseRate || '—'}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <motion.div className="rounded-2xl bg-white p-4 shadow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-medium">Revenue vs Targets</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#1A120B" fill="#d4a373" />
                <Area type="monotone" dataKey="target" stroke="#c9854d" fill="#f4efe6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="rounded-2xl bg-white p-4 shadow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-medium">Brand Sales Share</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={brandShare} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8">
                  {brandShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow">
        <h3 className="text-sm font-medium">Inventory Alerts</h3>
        <div className="mt-3 grid gap-3">
          {[{ name: 'Dark Roast Espresso', qty: 12 }, { name: 'Morning Blend', qty: 8 }, { name: 'Ethiopian Single Origin', qty: 3 }].map((it) => (
            <div key={it.name} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-[#6e4b33]">Low stock alert</div>
              </div>
              <div className="text-sm">{it.qty} left</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
