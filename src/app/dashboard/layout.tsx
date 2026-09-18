'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import '../globals.css';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { managerRouteFromSection } from '@/lib/manager-nav-slugs';
import { Bell, BarChart3, ChevronDown, ChevronsLeft, ChevronsRight, FileText, LayoutDashboard, LogOut, MessageSquare, Package, Search, Settings2, ShieldCheck, ShoppingBag, Star, Users, UserPlus, X } from 'lucide-react';

export type ManagerSection = 'Overview' | 'Orders' | 'Inventory' | 'Reports & Analytics' | 'Customers' | 'Admin Management' | 'Reviews Moderation' | 'Shop Management' | 'Content Management' | 'Register Customer';
export type AdminSection = 'Overview' | 'Orders' | 'Products' | 'Customers' | 'Reviews' | 'Support';
export type CustomerSection = 'My Orders' | 'Addresses' | 'My Reviews' | 'Wishlist' | 'Profile & Security';

const ManagerNavigationContext = createContext<{ activeSection: ManagerSection; setActiveSection: (section: ManagerSection) => void } | null>(null);
const AdminNavigationContext = createContext<{ activeSection: AdminSection; setActiveSection: (section: AdminSection) => void } | null>(null);
const CustomerNavigationContext = createContext<{ activeSection: CustomerSection; setActiveSection: (section: CustomerSection) => void } | null>(null);

export function useManagerNavigation() {
  const context = useContext(ManagerNavigationContext);
  if (!context) throw new Error('useManagerNavigation must be used inside DashboardLayout');
  return context;
}

export function useAdminNavigation() {
  const context = useContext(AdminNavigationContext);
  if (!context) throw new Error('useAdminNavigation must be used inside AdminDashboardLayout');
  return context;
}

export function useCustomerNavigation() {
  const context = useContext(CustomerNavigationContext);
  if (!context) throw new Error('useCustomerNavigation must be used inside CustomerDashboardLayout');
  return context;
}

function useDashboardAuth(pathname: string | null) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname?.startsWith('/dashboard')) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

  return { isAuthenticated, loading, user, logout, router };
}

function DefaultDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useDashboardAuth(pathname);

  if (loading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function ManagerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading, user, logout, router } = useDashboardAuth(pathname);

  const [activeSection, setActiveSection] = useState<ManagerSection>('Overview');
  const [openSection, setOpenSection] = useState<ManagerSection | null>('Overview');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  if (loading || !isAuthenticated) {
    return null;
  }

  const navigation: { label: ManagerSection; icon: typeof LayoutDashboard; children: string[] }[] = [
    { label: 'Overview', icon: LayoutDashboard, children: ["Today's snapshot", 'KPI cards', 'Revenue vs Target', 'Brand sales share'] },
    { label: 'Orders', icon: ShoppingBag, children: ['All orders', 'Pending orders', 'Completed orders', 'Refund requests'] },
    { label: 'Inventory', icon: Package, children: ['Product list', 'Low-stock alerts', 'Add new product', 'Edit product', 'Manage brands', 'Edit shop filters'] },
    { label: 'Reports & Analytics', icon: BarChart3, children: ['Revenue report', 'Sales by product', 'Sales by brand', 'Customer growth'] },
    { label: 'Customers', icon: Users, children: ['All customers', 'Customer detail view', 'Ban / Unban', 'Banned list'] },
    { label: 'Admin Management', icon: ShieldCheck, children: ['All admins', 'Register new admin'] },
    { label: 'Reviews Moderation', icon: Star, children: ['Pending reviews queue', 'Approved reviews', 'Rejected reviews'] },
    { label: 'Shop Management', icon: Settings2, children: ['Add product', 'Edit product', 'Manage brands', 'Edit shop filters'] },
    { label: 'Content Management', icon: FileText, children: ['Homepage sections', 'Promotional banners', 'Our Story', 'FAQ entries'] },
    { label: 'Register Customer', icon: UserPlus, children: ['Customer registration form'] },
  ];
  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || 'Manager';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ManagerNavigationContext.Provider value={{ activeSection, setActiveSection }}>
    <div className="min-h-screen bg-[oklch(0.18_0.01_240)] text-[oklch(0.92_0.005_240)]">
      <div className={`min-h-screen lg:grid ${collapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[240px_1fr]'}`}>
        <motion.aside animate={{ width: collapsed ? 64 : 240 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className="border-b border-[oklch(0.30_0.02_240)] bg-slate-800 p-3 text-white lg:border-b-0 lg:border-r">
          <motion.div
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="lg:sticky lg:top-3"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-1 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#77a6c6] text-sm font-bold">AC</div>
              <AnimatePresence initial={false}>{!collapsed && <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <div className="font-semibold tracking-wide">AromaCraft</div>
                <div className="text-xs text-slate-400">Manager workspace</div>
              </motion.div>}</AnimatePresence>
            </div>
            <nav className="mt-4 space-y-1">
              {navigation.map(({ label, icon: Icon, children }) => {
                const isActive = activeSection === label;
                const isOpen = openSection === label;
                return <div key={label}>
                  <button onClick={() => {
                    setActiveSection(label);
                    router.push(managerRouteFromSection(label));
                    setOpenSection((current) => current === label ? null : label);
                  }} title={collapsed ? label : undefined} className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-white/10 ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300'}`}>
                    {isActive && <motion.span layoutId="active-nav" className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-400" />}
                    <Icon size={17} className="shrink-0" /><AnimatePresence initial={false}>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 truncate">{label}</motion.span>}</AnimatePresence>
                    {!collapsed && <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}><ChevronDown size={15} /></motion.span>}
                  </button>
                  <AnimatePresence initial={false}>{isOpen && !collapsed && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-10 pr-1"><div className="space-y-0.5 py-1">{children.map((child) => <button key={child} onClick={() => router.push(managerRouteFromSection(label, child))} className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white">{child}</button>)}</div></motion.div>}</AnimatePresence>
                </div>;
              })}
            </nav>
            <button onClick={() => setCollapsed((value) => !value)} className="mt-5 flex w-full items-center justify-center rounded-md border border-white/10 py-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /><span className="ml-2 text-xs">Collapse</span></>}
            </button>
          </motion.div>
        </motion.aside>
        <main className="min-w-0 overflow-auto">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-slate-700 bg-slate-800 px-4 sm:px-7">
            <div className="hidden text-sm font-semibold text-white md:block">AromaCraft <span className="ml-2 font-normal text-slate-400">Manager Portal</span></div>
            <div className="relative max-w-xl flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders, products, customers" className="h-9 w-full rounded-md border border-slate-600 bg-slate-700 pl-9 pr-8 text-sm text-white outline-none placeholder:text-slate-400 focus:border-sky-400" />{search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-2 text-slate-400"><X size={15} /></button>}</div>
            <div className="flex items-center gap-4">
              <button aria-label="Notifications" className="relative rounded-md p-2 text-slate-300 hover:bg-slate-700"><Bell size={18} /><span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-slate-900">3</span></button>
              <div className="hidden items-center gap-2 sm:flex">
                {user?.avatarUrl ? <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-sky-200">{initials}</div>}
                <div><div className="text-sm font-semibold text-white">{displayName}</div><div className="text-xs text-slate-400">Manager</div></div>
              </div>
              <button onClick={() => void logout()} aria-label="Logout" className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"><LogOut size={15} /><span className="hidden sm:inline">Logout</span></button>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-[calc(100vh-96px)]"
          >
            {children}
          </motion.div>
          <footer className="flex h-10 items-center justify-center border-t border-slate-700 bg-slate-800 text-xs text-slate-400">© 2026 AromaCraft · Internal Operations · v1.0</footer>
        </main>
      </div>
    </div>
    </ManagerNavigationContext.Provider>
  );
}

function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading, user, logout, router } = useDashboardAuth(pathname);

  const [activeSection, setActiveSection] = useState<AdminSection>('Overview');
  const [openSection, setOpenSection] = useState<AdminSection | null>('Overview');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  if (loading || !isAuthenticated) {
    return null;
  }

  const navigation: { label: AdminSection; icon: typeof LayoutDashboard; children: string[] }[] = [
    { label: 'Overview', icon: LayoutDashboard, children: ['Today', 'Metrics'] },
    { label: 'Orders', icon: ShoppingBag, children: ['All Orders', 'Pending', 'Processing', 'Completed', 'Cancelled', 'Refund Requests'] },
    { label: 'Products', icon: Package, children: ['Product List', 'Add Product', 'Low Stock Alerts', 'Stock Adjustment'] },
    { label: 'Customers', icon: Users, children: ['Customer List', 'Customer Detail'] },
    { label: 'Reviews', icon: Star, children: ['Pending Reviews', 'Approve', 'Reject'] },
    { label: 'Support', icon: MessageSquare, children: ['Messages', 'Reply'] },
  ];

  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || 'Admin';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleNavClick = (section: AdminSection) => {
    setActiveSection(section);
    setOpenSection((current) => current === section ? null : section);
  };

  return (
    <AdminNavigationContext.Provider value={{ activeSection, setActiveSection }}>
    <div className="min-h-screen bg-[oklch(0.18_0.01_240)] text-[oklch(0.92_0.005_240)]">
      <div className={`min-h-screen lg:grid ${collapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[240px_1fr]'}`}>
        <motion.aside animate={{ width: collapsed ? 64 : 240 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className="border-b border-[oklch(0.30_0.02_240)] bg-slate-800 p-3 text-white lg:border-b-0 lg:border-r">
          <motion.div
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="lg:sticky lg:top-3"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-1 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#77a6c6] text-sm font-bold">AC</div>
              <AnimatePresence initial={false}>{!collapsed && <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <div className="font-semibold tracking-wide">AromaCraft</div>
                <div className="text-xs text-slate-400">Admin workspace</div>
              </motion.div>}</AnimatePresence>
            </div>
            <nav className="mt-4 space-y-1">
              {navigation.map(({ label, icon: Icon, children }) => {
                const isActive = activeSection === label;
                const isOpen = openSection === label;
                return <div key={label}>
                  <button onClick={() => handleNavClick(label)} title={collapsed ? label : undefined} className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-white/10 ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300'}`}>
                    {isActive && <motion.span layoutId="active-nav-admin" className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-400" />}
                    <Icon size={17} className="shrink-0" /><AnimatePresence initial={false}>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 truncate">{label}</motion.span>}</AnimatePresence>
                    {!collapsed && <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}><ChevronDown size={15} /></motion.span>}
                  </button>
                  <AnimatePresence initial={false}>{isOpen && !collapsed && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-10 pr-1"><div className="space-y-0.5 py-1">{children.map((child) => <button key={child} onClick={() => router.push(`/dashboard/admin?section=${encodeURIComponent(child)}`)} className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white">{child}</button>)}</div></motion.div>}</AnimatePresence>
                </div>;
              })}
            </nav>
            <button onClick={() => setCollapsed((value) => !value)} className="mt-5 flex w-full items-center justify-center rounded-md border border-white/10 py-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /><span className="ml-2 text-xs">Collapse</span></>}
            </button>
          </motion.div>
        </motion.aside>
        <main className="min-w-0 overflow-auto">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-slate-700 bg-slate-800 px-4 sm:px-7">
            <div className="hidden text-sm font-semibold text-white md:block">AromaCraft <span className="ml-2 font-normal text-slate-400">Admin Portal</span></div>
            <div className="relative max-w-xl flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders, products, customers" className="h-9 w-full rounded-md border border-slate-600 bg-slate-700 pl-9 pr-8 text-sm text-white outline-none placeholder:text-slate-400 focus:border-sky-400" />{search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-2 text-slate-400"><X size={15} /></button>}</div>
            <div className="flex items-center gap-4">
              <button aria-label="Notifications" className="relative rounded-md p-2 text-slate-300 hover:bg-slate-700"><Bell size={18} /><span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-slate-900">1</span></button>
              <div className="hidden items-center gap-2 sm:flex">
                {user?.avatarUrl ? <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-sky-200">{initials}</div>}
                <div><div className="text-sm font-semibold text-white">{displayName}</div><div className="text-xs text-slate-400">Admin</div></div>
              </div>
              <button onClick={() => void logout()} aria-label="Logout" className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"><LogOut size={15} /><span className="hidden sm:inline">Logout</span></button>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-[calc(100vh-96px)]"
          >
            {children}
          </motion.div>
          <footer className="flex h-10 items-center justify-center border-t border-slate-700 bg-slate-800 text-xs text-slate-400">© 2026 AromaCraft · Admin Operations · v1.0</footer>
        </main>
      </div>
    </div>
    </AdminNavigationContext.Provider>
  );
}

function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading, user, logout, router } = useDashboardAuth(pathname);

  const [activeSection, setActiveSection] = useState<CustomerSection>('My Orders');
  const [openSection, setOpenSection] = useState<CustomerSection | null>('My Orders');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  if (loading || !isAuthenticated) {
    return null;
  }

  const navigation: { label: CustomerSection; icon: typeof LayoutDashboard; children: string[] }[] = [
    { label: 'My Orders', icon: ShoppingBag, children: ['Order History', 'Tracking'] },
    { label: 'Addresses', icon: LayoutDashboard, children: ['Saved Addresses', 'Add Address'] },
    { label: 'My Reviews', icon: Star, children: ['My Reviews', 'Write Review'] },
    { label: 'Wishlist', icon: Users, children: ['Wishlist Items'] },
    { label: 'Profile & Security', icon: Settings2, children: ['Personal Info', 'Change Password'] },
  ];

  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || 'Customer';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleNavClick = (section: CustomerSection) => {
    setActiveSection(section);
    setOpenSection((current) => current === section ? null : section);
  };

  return (
    <CustomerNavigationContext.Provider value={{ activeSection, setActiveSection }}>
    <div className="min-h-screen bg-[oklch(0.18_0.01_240)] text-[oklch(0.92_0.005_240)]">
      <div className={`min-h-screen lg:grid ${collapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[240px_1fr]'}`}>
        <motion.aside animate={{ width: collapsed ? 64 : 240 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className="border-b border-[oklch(0.30_0.02_240)] bg-slate-800 p-3 text-white lg:border-b-0 lg:border-r">
          <motion.div
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="lg:sticky lg:top-3"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-1 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#77a6c6] text-sm font-bold">AC</div>
              <AnimatePresence initial={false}>{!collapsed && <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <div className="font-semibold tracking-wide">AromaCraft</div>
                <div className="text-xs text-slate-400">My Account</div>
              </motion.div>}</AnimatePresence>
            </div>
            <nav className="mt-4 space-y-1">
              {navigation.map(({ label, icon: Icon, children }) => {
                const isActive = activeSection === label;
                const isOpen = openSection === label;
                return <div key={label}>
                  <button onClick={() => handleNavClick(label)} title={collapsed ? label : undefined} className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-white/10 ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300'}`}>
                    {isActive && <motion.span layoutId="active-nav-customer" className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-400" />}
                    <Icon size={17} className="shrink-0" /><AnimatePresence initial={false}>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 truncate">{label}</motion.span>}</AnimatePresence>
                    {!collapsed && <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}><ChevronDown size={15} /></motion.span>}
                  </button>
                  <AnimatePresence initial={false}>{isOpen && !collapsed && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-10 pr-1"><div className="space-y-0.5 py-1">{children.map((child) => <button key={child} onClick={() => router.push(`/dashboard/customer?section=${encodeURIComponent(child)}`)} className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white">{child}</button>)}</div></motion.div>}</AnimatePresence>
                </div>;
              })}
            </nav>
            <button onClick={() => setCollapsed((value) => !value)} className="mt-5 flex w-full items-center justify-center rounded-md border border-white/10 py-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /><span className="ml-2 text-xs">Collapse</span></>}
            </button>
          </motion.div>
        </motion.aside>
        <main className="min-w-0 overflow-auto">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-slate-700 bg-slate-800 px-4 sm:px-7">
            <div className="hidden text-sm font-semibold text-white md:block">AromaCraft <span className="ml-2 font-normal text-slate-400">Customer Account</span></div>
            <div className="relative max-w-xl flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders, reviews" className="h-9 w-full rounded-md border border-slate-600 bg-slate-700 pl-9 pr-8 text-sm text-white outline-none placeholder:text-slate-400 focus:border-sky-400" />{search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-2 text-slate-400"><X size={15} /></button>}</div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 sm:flex">
                {user?.avatarUrl ? <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-sky-200">{initials}</div>}
                <div><div className="text-sm font-semibold text-white">{displayName}</div><div className="text-xs text-slate-400">Customer</div></div>
              </div>
              <button onClick={() => void logout()} aria-label="Logout" className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"><LogOut size={15} /><span className="hidden sm:inline">Logout</span></button>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-[calc(100vh-96px)]"
          >
            {children}
          </motion.div>
          <footer className="flex h-10 items-center justify-center border-t border-slate-700 bg-slate-800 text-xs text-slate-400">© 2026 AromaCraft · My Account · v1.0</footer>
        </main>
      </div>
    </div>
    </CustomerNavigationContext.Provider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/dashboard/manager')) {
    return <ManagerDashboardLayout>{children}</ManagerDashboardLayout>;
  } else if (pathname?.startsWith('/dashboard/admin')) {
    return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
  } else if (pathname?.startsWith('/dashboard/customer')) {
    return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>;
  }
  return <DefaultDashboardLayout>{children}</DefaultDashboardLayout>;
}
