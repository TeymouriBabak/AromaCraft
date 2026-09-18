'use client';

import { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartWrapper({
  title,
  description,
  children,
  className = '',
}: ChartWrapperProps) {
  return (
    <div className={`border border-[oklch(0.30_0.02_240)] bg-[oklch(0.23_0.015_240)] p-5 shadow-lg ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-slate-100">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
