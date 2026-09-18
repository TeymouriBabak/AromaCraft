'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SiteShell from '@/components/site-shell';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  if (pathname?.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  return <SiteShell>{children}</SiteShell>;
}
