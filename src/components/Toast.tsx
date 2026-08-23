'use client';

import { useEffect } from 'react';

export default function Toast({
  message,
  tone = 'info',
  onClose,
}: {
  message: string;
  tone?: 'info' | 'error' | 'success';
  onClose?: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const toneStyles = {
    info: 'bg-gray-800 text-white',
    success: 'bg-green-700 text-white',
    error: 'bg-red-600 text-white',
  } as const;

  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl p-3 shadow ${toneStyles[tone]}`}
      role="status"
    >
      <div className="text-sm">{message}</div>
    </div>
  );
}
