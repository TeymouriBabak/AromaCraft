"use client";

export default function Skeleton({ className = "", rows = 1 }: { className?: string; rows?: number }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 w-full rounded bg-gray-200/60 dark:bg-gray-700/40" />
      ))}
    </div>
  );
}
