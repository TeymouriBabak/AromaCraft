'use client';

export type StatusBadgeType = 'success' | 'pending' | 'error' | 'warning' | 'info';

interface StatusBadgeProps {
  type: StatusBadgeType;
  children: string;
  className?: string;
}

const typeClasses: Record<StatusBadgeType, string> = {
  success: 'bg-emerald-400/10 text-emerald-400',
  pending: 'bg-amber-400/10 text-amber-400',
  error: 'bg-red-400/10 text-red-400',
  warning: 'bg-orange-400/10 text-orange-400',
  info: 'bg-sky-400/10 text-sky-400',
};

export function StatusBadge({
  type,
  children,
  className = '',
}: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${typeClasses[type]} ${className}`}>
      {children}
    </span>
  );
}
