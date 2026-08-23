'use client';

import React, { useEffect } from 'react';
import '../globals.css';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/components/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname?.startsWith('/dashboard')) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1A120B]">
      <div className="min-h-screen grid grid-cols-[280px_1fr]">
        <aside className="border-r border-[#e9e1d6] bg-[rgba(26,18,11,0.06)] p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="sticky top-6"
          >
            <ClientSidebar />
          </motion.div>
        </aside>
        <main className="overflow-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
