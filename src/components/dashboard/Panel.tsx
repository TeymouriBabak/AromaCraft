'use client';

import { ReactNode } from 'react';

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
