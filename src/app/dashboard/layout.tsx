'use client';

import React, { useEffect } from 'react';
import '../globals.css';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { Bell, LayoutDashboard, LogOut, Package, ShieldCheck, ShoppingBag, Star, Users, BarChart3 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, logout } = useAuth();
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

  const isManager = pathname?.startsWith('/dashboard/manager');

  if (!isManager) {
    return <>{children}</>;
  }

  const navigation = [
    { label: 'Overview', icon: LayoutDashboard, href: '#overview' },
    { label: 'Orders', icon: ShoppingBag, href: '#orders' },
    { label: 'Inventory', icon: Package, href: '#inventory' },
    { label: 'Reports & Analytics', icon: BarChart3, href: '#reports' },
    { label: 'Customers', icon: Users, href: '#customers' },
    { label: 'Admin Management', icon: ShieldCheck, href: '#admins' },
    { label: 'Reviews Moderation', icon: Star, href: '#reviews' },
    { label: 'Shop Management', icon: ShoppingBag, href: '#shop' },
  ];
  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || 'Manager';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#3a4454]">
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#dce2e9] bg-[#273345] p-5 text-white lg:border-b-0 lg:border-r">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:sticky lg:top-5"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#77a6c6] text-sm font-bold">AC</div>
              <div>
                <div className="font-semibold tracking-wide">AromaCraft</div>
                <div className="text-xs text-[#b8c5d1]">Management workspace</div>
              </div>
            </div>
            <nav className="mt-5 grid grid-cols-2 gap-1 lg:block lg:space-y-1">
              {navigation.map(({ label, icon: Icon, href }, index) => (
                <a key={label} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/10 ${index === 0 ? 'bg-[#4c7ea8] text-white' : 'text-[#c7d1dc]'}`}>
                  <Icon size={17} />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </motion.div>
        </aside>
        <main className="min-w-0 overflow-auto">
          <header className="flex items-center justify-between border-b border-[#dce2e9] bg-white px-5 py-4 sm:px-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7890a5]">Manager portal</div>
              <div className="mt-1 text-lg font-semibold text-[#273345]">Operations overview</div>
            </div>
            <div className="flex items-center gap-4">
              <button aria-label="Notifications" className="relative rounded-lg p-2 text-[#66788b] hover:bg-[#f0f3f6]"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d9822b]" /></button>
              <div className="hidden items-center gap-2 sm:flex">
                {user?.avatarUrl ? <Image src={user.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dceaf3] text-xs font-bold text-[#346486]">{initials}</div>}
                <div className="text-right"><div className="text-sm font-semibold text-[#273345]">{displayName}</div><div className="text-xs text-[#7890a5]">Manager</div></div>
              </div>
              <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-lg border border-[#dce2e9] px-3 py-2 text-sm font-medium text-[#526375] hover:bg-[#f4f6f9]"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></button>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
          <footer className="mt-12 border-t border-[#dce2e9] px-5 py-5 text-xs text-[#7890a5] sm:px-8">© {new Date().getFullYear()} AromaCraft · Internal operations</footer>
        </main>
      </div>
    </div>
  );
}
