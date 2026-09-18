'use client';

import { ReactNode } from 'react';
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

export interface PanelProps {
  title: string;
  description?: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function Panel({
  title,
  description,
  children,
  action,
}: PanelProps) {
  return (
    <section className="border border-[oklch(0.30_0.02_240)] bg-[oklch(0.23_0.015_240)] p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export interface LowStockItem {
  id: number;
  name: string;
  brand: string;
  inventory: number;
}

export function LowStockGrid({ items }: { items: LowStockItem[] }) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between border border-slate-700 p-3"
        >
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-slate-400">{item.brand}</div>
          </div>
          <div
            className={`text-sm font-semibold ${
              item.inventory <= 5 ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {item.inventory}
          </div>
        </div>
      ))}
    </div>
  );
}
