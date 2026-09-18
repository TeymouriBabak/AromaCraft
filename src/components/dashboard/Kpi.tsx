'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface KpiData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

export function Kpi({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: KpiData) {
  const positive = trend?.startsWith('+') ?? false;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-l-2 bg-[oklch(0.23_0.015_240)] p-4 shadow-lg"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <Icon size={19} style={{ color }} />
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-100">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </motion.div>
  );
}
