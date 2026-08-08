'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const buildAdminMetrics = () => Array.from({ length: 30 }).map((_, i) => ({ day: `${i + 1}`, newUsers: Math.round(Math.random() * 30), dau: Math.round(Math.random() * 100) }));
const buildRevenueChannels = () => Array.from({ length: 7 }).map((_, i) => ({ day: `D${i + 1}`, direct: Math.round(Math.random() * 1000), subs: Math.round(Math.random() * 600), wholesale: Math.round(Math.random() * 400) }));

export default function AdminDashboard() {
  const metrics = useMemo(() => buildAdminMetrics(), []);
  const revenueChannels = useMemo(() => buildRevenueChannels(), []);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <motion.div className="rounded-2xl bg-white p-4 shadow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-medium">New Users vs DAU</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={metrics}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="newUsers" stroke="#d4a373" />
                <Line type="monotone" dataKey="dau" stroke="#1A120B" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="rounded-2xl bg-white p-4 shadow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-medium">Revenue Channels</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={revenueChannels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="direct" stackId="a" fill="#d4a373" />
                <Bar dataKey="subs" stackId="a" fill="#c9854d" />
                <Bar dataKey="wholesale" stackId="a" fill="#1A120B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow">
        <h3 className="text-sm font-medium">User Management</h3>
        <p className="mt-2 text-sm text-[#6e4b33]">Quick list of seeded users and role toggles.</p>
      </div>
    </div>
  );
}
