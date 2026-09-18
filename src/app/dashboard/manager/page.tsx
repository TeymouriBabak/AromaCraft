'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Check, ClipboardList, DollarSign, FileDown, MessageSquare, Plus, Search, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import useManagerStats from '@/hooks/useManagerStats';
import { useManagerNavigation, type ManagerSection } from '@/app/dashboard/layout';
import { signupSchema, type SignupFormValues } from '@/lib/auth-validation';
import { Kpi, Panel } from '@/components/manager-dashboard-components';

type Overview = { totalRevenue?: number; totalOrders?: number; totalCustomers?: number; pendingReviews?: number; inventoryAlerts?: number; revenueChange?: number | null; ordersChange?: number | null; brandShare?: { name: string; value: number }[]; lowStockItems?: { id: number; name: string; brand: string; inventory: number }[]; revenueData?: { month: string; revenue: number; target: number }[] };
const fieldGroups: { fields: { key: keyof SignupFormValues; label: string; type?: string }[] }[] = [
  { fields: [{ key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' }, { key: 'gender', label: 'Gender' }] },
  { fields: [{ key: 'username', label: 'Username' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'mobile', label: 'Mobile with country code' }] },
  { fields: [{ key: 'password', label: 'Password', type: 'password' }, { key: 'confirmPassword', label: 'Confirm password', type: 'password' }] },
];

function RegistrationForm({ role }: { role: 'ADMIN' | 'CUSTOMER' }) {
  const initialValues: SignupFormValues = {
    firstName: '',
    lastName: '',
    gender: '',
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
  };
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormValues, string>>>({});

  const password = values.password;
  const strength = password ? [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) => rule.test(password)).length : 0;

  const updateField = (key: keyof SignupFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateVisibleFields = () => {
    const visibleKeys = fieldGroups[step].fields.map((field) => field.key);
    const visibleValues = Object.fromEntries(visibleKeys.map((key) => [key, values[key]]));
    const result = signupSchema.safeParse({ ...values, ...visibleValues });

    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const nextFieldErrors: Partial<Record<keyof SignupFormValues, string>> = {};
    visibleKeys.forEach((key) => {
      const fieldError = nextErrors[key]?.[0];
      if (fieldError) {
        nextFieldErrors[key] = fieldError;
      }
    });
    setErrors(nextFieldErrors);
    return false;
  };

  const submit = () => {
    const result = signupSchema.safeParse(values);
    if (!result.success) {
      const nextErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const nextFieldErrors: Partial<Record<keyof SignupFormValues, string>> = {};
      (Object.keys(nextErrors) as (keyof SignupFormValues)[]).forEach((key) => {
        const message = nextErrors[key]?.[0];
        if (message) {
          nextFieldErrors[key] = message;
        }
      });
      setErrors(nextFieldErrors);
      return;
    }

    setMessage(`${role === 'ADMIN' ? 'Admin' : 'Customer'} registration submitted.`);
  };

  return <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="mt-5"><div className="mb-5 flex items-center gap-2">{['Personal', 'Account', 'Security', 'Review'].map((label, index) => <div key={label} className="flex flex-1 items-center gap-2"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index <= step ? 'bg-sky-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>{index < step ? <Check size={14} /> : index + 1}</div><span className="hidden text-xs text-slate-400 sm:block">{label}</span>{index < 3 && <div className={`h-px flex-1 ${index < step ? 'bg-sky-500' : 'bg-slate-700'}`} />}</div>)}</div><AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} className="grid gap-3 sm:grid-cols-2">{step < 3 ? fieldGroups[step].fields.map(({ key, label, type }) => <label key={key} className="text-sm text-slate-300">{label}<input value={values[key]} onChange={(event) => updateField(key, event.target.value)} type={type ?? 'text'} className={`mt-1.5 w-full rounded-md border bg-slate-800 px-3 py-2.5 text-slate-100 outline-none ${errors[key] ? 'border-red-500' : 'border-slate-600 focus:border-sky-400'}`} />{errors[key] && <span className="mt-1 block text-xs text-red-400">{errors[key]}</span>}{!errors[key] && values[key] && <Check size={14} className="mt-1 text-emerald-400" />}</label>) : <><label className="text-sm text-slate-300 sm:col-span-2">Profile photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => updateField('avatarUrl', event.target.files?.[0]?.name ?? '')} className="mt-1.5 block w-full rounded-md border border-dashed border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-400" /></label><div className="sm:col-span-2"><div className="mb-2 text-sm text-slate-300">Password strength</div><div className="flex gap-1">{[0, 1, 2, 3].map((level) => <div key={level} className={`h-1.5 flex-1 ${level < strength ? strength > 3 ? 'bg-emerald-400' : 'bg-amber-400' : 'bg-slate-700'}`} />)}</div><div className="mt-2 text-xs text-slate-400">Review the details before submitting.</div></div></>}</motion.div></AnimatePresence><div className="mt-5 flex flex-wrap items-center gap-2"><button type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)} className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-300 disabled:opacity-40">Back</button>{step < 3 ? <button type="button" onClick={() => { if (validateVisibleFields()) setStep((value) => value + 1); }} className="rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950">Continue</button> : <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950"><Plus size={15} /> Register</button>}{message && <span className="text-sm text-emerald-400">{message}</span>}</div></form>;
}

function DataSection({ section }: { section: ManagerSection }) {
  const [query, setQuery] = useState('');
  const rows = section === 'Customers' ? ['Maya Chen', 'Oliver Grant', 'Amelia Stone'] : section === 'Orders' ? ['#AC-1048', '#AC-1047', '#AC-1046'] : ['Cedar Bloom', 'Night Shift', 'Solstice Blend'];
  return <Panel title={section} description={`Manage ${section.toLowerCase()} without leaving the manager portal.`} action={<button className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950"><Plus size={15} /> Add</button>}><div className="relative mt-5 max-w-sm"><Search size={15} className="absolute left-3 top-2.5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.toLowerCase()}`} className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 text-sm text-slate-100 outline-none" /></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-155 text-left text-sm"><thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Record</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Details</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{rows.filter((row) => row.toLowerCase().includes(query.toLowerCase())).map((row) => <tr key={row} className="border-b border-slate-700/70 text-slate-300"><td className="px-3 py-3 font-medium text-slate-100">{row}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">Active</span></td><td className="px-3 py-3 text-slate-400">Updated today</td><td className="px-3 py-3"><button className="text-sky-400 hover:text-sky-300">View details</button></td></tr>)}</tbody></table></div></Panel>;
}

export default function ManagerDashboard() {
  const { activeSection } = useManagerNavigation();
  const { data, loading, error } = useManagerStats();
  const overview = (data?.overview ?? {}) as Overview;
  const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (loading) return <div className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-6 text-sm text-slate-400">Loading manager overview...</div>;
  if (error) return <div className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-6 text-sm text-red-400">Unable to load manager metrics right now.</div>;
  const lowStock = overview.lowStockItems ?? [];
  const revenueData = overview.revenueData ?? [];
  const brandShare = (overview.brandShare ?? []).map((brand, index) => ({ ...brand, color: ['#5ea8d6', '#72b58d', '#e0a64d', '#bd8bbd'][index % 4] }));
  const formatChange = (value: number | null | undefined) => value === null || value === undefined ? undefined : `${value >= 0 ? '+' : ''}${value}%`;
  const kpis: { label: string; value: string | number; icon: LucideIcon; color: string; trend?: string }[] = [{ label: 'Revenue', value: `$${(overview.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: '#72b58d', trend: formatChange(overview.revenueChange) }, { label: 'Orders', value: overview.totalOrders ?? 0, icon: ClipboardList, color: '#5ea8d6', trend: formatChange(overview.ordersChange) }, { label: 'Customers', value: overview.totalCustomers ?? 0, icon: Users, color: '#bd8bbd' }, { label: 'Reviews', value: overview.pendingReviews ?? 0, icon: MessageSquare, color: '#e0a64d' }, { label: 'Low-stock', value: overview.inventoryAlerts ?? lowStock.length, icon: AlertTriangle, color: '#db6b63' }];
  return <div className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7"><AnimatePresence mode="wait"><motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
    {activeSection === 'Overview' && <><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-sky-400">{formattedDate}</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Good morning, manager</h1><p className="mt-2 text-sm text-slate-400">Today&apos;s snapshot across AromaCraft operations.</p></div><button className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-300">Last 30 days</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{kpis.map((kpi) => <Kpi key={kpi.label} {...kpi} />)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><Panel title="Revenue vs target" description="Monthly performance"><div className="mt-5 h-64"><ResponsiveContainer><AreaChart data={revenueData}><XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#64748b" /><YAxis tickLine={false} axisLine={false} stroke="#64748b" /><Tooltip /><Area name="Revenue" type="monotone" dataKey="revenue" stroke="#5ea8d6" fill="#5ea8d6" fillOpacity={0.18} strokeWidth={2} /><Area name="Target" type="monotone" dataKey="target" stroke="#e0a64d" fill="none" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></Panel><Panel title="Brand sales share"><div className="mt-4 h-64"><ResponsiveContainer><PieChart><Pie data={brandShare} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} label={({ value }) => `${value}%`}>{brandShare.map((brand) => <Cell key={brand.name} fill={brand.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Panel></div><Panel title="Low-stock alerts" description={`${lowStock.length} items need attention`} action={<button className="text-sm text-sky-400">View inventory</button>}><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{lowStock.map((item) => <div key={item.id} className="flex items-center justify-between border border-slate-700 p-3"><div><div className="font-medium">{item.name}</div><div className="text-xs text-slate-400">{item.brand}</div></div><span className="rounded-full bg-red-400/10 px-2 py-1 text-xs font-bold text-red-400">{item.inventory} left</span></div>)}</div></Panel></>}
    {activeSection === 'Reports & Analytics' && <div className="grid gap-5 xl:grid-cols-2"><Panel title="Revenue report" description="Last 30 days" action={<button className="inline-flex items-center gap-2 text-sm text-sky-400"><FileDown size={15} /> Export as CSV</button>}><div className="mt-5 h-72"><ResponsiveContainer><AreaChart data={revenueData}><XAxis dataKey="month" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip /><Area dataKey="revenue" stroke="#5ea8d6" fill="#5ea8d6" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div></Panel><Panel title="Daily sales" description="Order revenue by day"><div className="mt-5 h-72"><ResponsiveContainer><BarChart data={revenueData}><XAxis dataKey="month" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip /><Bar dataKey="revenue" fill="#72b58d" /></BarChart></ResponsiveContainer></div></Panel></div>}
    {(activeSection === 'Inventory' || activeSection === 'Shop Management') && <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]"><DataSection section="Inventory" /><Panel title="Add new product" description="Create a product card for the public shop."><div className="mt-5 grid gap-3 sm:grid-cols-2">{['Name', 'Brand', 'Category', 'Price', 'Stock quantity', 'Weight', 'Roast level', 'Flavor notes'].map((label) => <label key={label} className="text-sm text-slate-300">{label}<input className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" /></label>)}</div><button className="mt-4 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950">Save product</button></Panel></div>}
    {activeSection === 'Admin Management' && <Panel title="Register new admin" description="Manager-only registration with the public validation rules."><RegistrationForm role="ADMIN" /></Panel>}
    {activeSection === 'Register Customer' && <Panel title="Register customer" description="Create a customer account from the operations workspace."><RegistrationForm role="CUSTOMER" /></Panel>}
    {activeSection === 'Customers' && <DataSection section="Customers" />}{activeSection === 'Orders' && <DataSection section="Orders" />}
    {activeSection === 'Reviews Moderation' && <Panel title="Reviews moderation" description="Approve or reject testimonials and product reviews before publication."><div className="mt-5 grid gap-3 md:grid-cols-2">{['Pending homepage testimonial', 'Pending product review'].map((review) => <div key={review} className="border border-slate-700 p-4"><div className="flex items-center justify-between"><span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs text-amber-400">Pending</span><span className="text-amber-400">★★★★★</span></div><h3 className="mt-3 font-semibold">{review}</h3><p className="mt-1 text-sm text-slate-400">Review text is awaiting manager moderation.</p><div className="mt-4 flex gap-2"><button className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950">Approve</button><button className="rounded-md bg-red-500 px-3 py-2 text-xs font-semibold text-white">Reject</button></div></div>)}</div></Panel>}
    {activeSection === 'Content Management' && <Panel title="Content management" description="Manage customer-facing content from one internal workspace."><div className="mt-5 grid gap-3 sm:grid-cols-2">{['Homepage sections', 'Promotional banners', 'Our Story', 'FAQ entries'].map((item) => <button key={item} className="border border-slate-700 p-5 text-left transition-colors hover:border-sky-500"><div className="font-semibold">{item}</div><div className="mt-1 text-sm text-slate-400">Edit and publish content</div></button>)}</div></Panel>}
  </motion.div></AnimatePresence></div>;
}