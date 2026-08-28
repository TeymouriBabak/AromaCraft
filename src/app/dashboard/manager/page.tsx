'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ClipboardList, DollarSign, MessageSquare, Plus, ShieldCheck, Users } from 'lucide-react';
import useManagerStats from '@/hooks/useManagerStats';
import { signupSchema, type SignupFormValues } from '@/lib/auth-validation';

type Overview = {
  totalRevenue?: number; totalOrders?: number; totalCustomers?: number; pendingReviews?: number; inventoryAlerts?: number;
  lowStockItems?: { id: number; name: string; brand: string; inventory: number }[];
  revenueData?: { month: string; revenue: number; target: number }[];
};

const brandShare = [
  { name: 'AromaCraft', value: 45, color: '#4c7ea8' },
  { name: 'Northstar', value: 24, color: '#5c9b7a' },
  { name: 'Mosaic Roasters', value: 18, color: '#d9822b' },
  { name: 'Other brands', value: 13, color: '#9b6b9e' },
];
const fields: { key: keyof SignupFormValues; label: string; type?: string }[] = [
  { key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' }, { key: 'gender', label: 'Gender' },
  { key: 'username', label: 'Username' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'mobile', label: 'Mobile with country code' },
  { key: 'password', label: 'Password', type: 'password' }, { key: 'confirmPassword', label: 'Confirm password', type: 'password' },
];

function Kpi({ label, value, icon: Icon, color, trend }: { label: string; value: string | number; icon: typeof DollarSign; color: string; trend: string }) {
  const positive = trend.startsWith('+');
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#dce2e9] bg-white p-5 shadow-[0_5px_18px_rgba(39,51,69,0.05)]">
    <div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18`, color }}><Icon size={19} /></div><span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-[#438567]' : 'text-[#bd5d55]'}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{trend}</span></div>
    <div className="mt-5 text-2xl font-bold text-[#273345]">{value}</div><div className="mt-1 text-sm text-[#7890a5]">{label}</div>
  </motion.div>;
}

function RegistrationForm({ role }: { role: 'ADMIN' | 'CUSTOMER' }) {
  const [values, setValues] = useState<SignupFormValues>({ firstName: '', lastName: '', gender: '', username: '', mobile: '', email: '', password: '', confirmPassword: '', avatarUrl: '' });
  const [message, setMessage] = useState('');
  const submit = (event: React.FormEvent) => { event.preventDefault(); const result = signupSchema.safeParse(values); setMessage(result.success ? `${role === 'ADMIN' ? 'Admin' : 'Customer'} details validated and ready to register.` : (result.error.issues[0]?.message ?? 'Check the form fields.')); };
  return <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
    {fields.map(({ key, label, type }) => <label key={key} className="text-sm font-medium text-[#526375]">{label}<input required type={type ?? 'text'} value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#dce2e9] bg-[#fbfcfd] px-3 py-2.5 text-[#273345] outline-none focus:border-[#4c7ea8]" /></label>)}
    <label className="text-sm font-medium text-[#526375] sm:col-span-2">Profile photo upload<input required type="file" accept="image/*" className="mt-1.5 block w-full rounded-lg border border-dashed border-[#b9c9d6] bg-[#fbfcfd] px-3 py-2 text-sm" onChange={(event) => setValues({ ...values, avatarUrl: event.target.files?.[0]?.name ?? '' })} /></label>
    <div className="flex items-center gap-3 sm:col-span-2"><button className="inline-flex items-center gap-2 rounded-lg bg-[#4c7ea8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3f6d94]"><Plus size={16} /> Register {role === 'ADMIN' ? 'admin' : 'customer'}</button>{message && <span className="text-sm text-[#526375]">{message}</span>}</div>
  </form>;
}

export default function ManagerDashboard() {
  const { data, loading, error } = useManagerStats();
  const overview = (data?.overview ?? {}) as Overview;
  if (loading) return <div className="p-8 text-sm text-[#7890a5]">Loading manager overview...</div>;
  if (error) return <div className="p-8 text-sm text-[#bd5d55]">Unable to load manager metrics right now.</div>;
  const lowStock = overview.lowStockItems ?? [];
  const revenueData = overview.revenueData ?? [];
  const kpis = [
    ['Total revenue', `$${(overview.totalRevenue ?? 0).toLocaleString()}`, DollarSign, '#4c7ea8', '+8.4%'], ['Total orders', overview.totalOrders ?? 0, ClipboardList, '#5c9b7a', '+5.1%'],
    ['Active customers', overview.totalCustomers ?? 0, Users, '#9b6b9e', '+12.6%'], ['Pending reviews', overview.pendingReviews ?? 0, MessageSquare, '#d9822b', '-2.3%'], ['Low-stock items', overview.inventoryAlerts ?? lowStock.length, AlertTriangle, '#bd5d55', '-4.0%'],
  ] as const;
  return <div className="bg-[#f4f6f9] p-5 sm:p-8">
    <section id="overview"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-[#4c7ea8]">Friday, August 28, 2026</p><h1 className="mt-1 text-3xl font-bold text-[#273345]">Good morning, manager</h1><p className="mt-2 text-sm text-[#7890a5]">Here is what is happening across AromaCraft today.</p></div><button className="rounded-lg border border-[#dce2e9] bg-white px-4 py-2.5 text-sm font-semibold text-[#526375]">Last 30 days</button></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{kpis.map(([label, value, icon, color, trend]) => <Kpi key={label} label={label} value={value} icon={icon} color={color} trend={trend} />)}</div>
    </section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <section id="reports" className="rounded-xl border border-[#dce2e9] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#273345]">Revenue vs target</h2><p className="mt-1 text-xs text-[#7890a5]">Monthly performance</p></div><span className="rounded-full bg-[#edf5fa] px-2.5 py-1 text-xs font-semibold text-[#4c7ea8]">Live data</span></div><div className="mt-5 h-64"><ResponsiveContainer><AreaChart data={revenueData}><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} /><Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} /><Legend /><Area name="Revenue" type="monotone" dataKey="revenue" stroke="#4c7ea8" fill="#dceaf3" strokeWidth={2} /><Area name="Target" type="monotone" dataKey="target" stroke="#d9822b" fill="#fff1df" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section>
      <section className="rounded-xl border border-[#dce2e9] bg-white p-5"><h2 className="font-semibold text-[#273345]">Brand sales share</h2><div className="mt-4 h-64"><ResponsiveContainer><PieChart><Pie data={brandShare} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} label={({ value }) => `${value}%`}>{brandShare.map((brand) => <Cell key={brand.name} fill={brand.color} />)}</Pie><Tooltip formatter={(value) => `${value}%`} /><Legend /></PieChart></ResponsiveContainer></div></section>
    </div>
    <section id="inventory" className="mt-6 rounded-xl border border-[#dce2e9] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#273345]">Low-stock inventory</h2><p className="mt-1 text-xs text-[#7890a5]">{lowStock.length} items need attention</p></div><button className="text-sm font-semibold text-[#4c7ea8]">View inventory</button></div><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{lowStock.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border border-[#edf0f3] p-3"><div><div className="font-medium text-[#273345]">{item.name}</div><div className="text-xs text-[#7890a5]">{item.brand}</div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.inventory <= 3 ? 'bg-[#fce9e8] text-[#bd5d55]' : 'bg-[#fff1df] text-[#b96d1f]'}`}>{item.inventory} left</span></div>)}</div></section>
    <section id="customers" className="mt-6 rounded-xl border border-[#dce2e9] bg-white p-5"><h2 className="font-semibold text-[#273345]">Customers</h2><p className="mt-1 text-sm text-[#7890a5]">Review account activity, order history, and ban or unban customer access.</p><div className="mt-4 rounded-lg bg-[#f4f6f9] p-4 text-sm text-[#526375]">Customer records are ready for the next management action.</div></section>
    <section id="reviews" className="mt-6 rounded-xl border border-[#dce2e9] bg-white p-5"><h2 className="font-semibold text-[#273345]">Reviews moderation</h2><p className="mt-1 text-sm text-[#7890a5]">Approve or reject homepage testimonials and product reviews from one queue.</p><div className="mt-4 flex items-center gap-3 rounded-lg bg-[#fff8ed] p-4 text-sm text-[#8b641f]"><MessageSquare size={18} /> {overview.pendingReviews ?? 0} submissions awaiting review</div></section>
    <section id="shop" className="mt-6 rounded-xl border border-[#dce2e9] bg-white p-5"><h2 className="font-semibold text-[#273345]">Shop management</h2><p className="mt-1 text-sm text-[#7890a5]">Manage products, brands, and the filters used by the public shop.</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg bg-[#4c7ea8] px-3 py-2 text-sm font-semibold text-white">Add product</button><button className="rounded-lg border border-[#dce2e9] px-3 py-2 text-sm font-semibold text-[#526375]">Manage brands</button><button className="rounded-lg border border-[#dce2e9] px-3 py-2 text-sm font-semibold text-[#526375]">Edit filters</button></div></section>
    <section id="admins" className="mt-6 grid gap-6 xl:grid-cols-2"><div className="rounded-xl border border-[#dce2e9] bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck size={19} className="text-[#4c7ea8]" /><h2 className="font-semibold text-[#273345]">Register new admin</h2></div><p className="mt-1 text-sm text-[#7890a5]">Manager-only account creation with the same validation as public sign-up.</p><RegistrationForm role="ADMIN" /></div><div className="rounded-xl border border-[#dce2e9] bg-white p-5"><h2 className="font-semibold text-[#273345]">Register new customer</h2><p className="mt-1 text-sm text-[#7890a5]">Create a customer account directly from operations.</p><RegistrationForm role="CUSTOMER" /></div></section>
    <div id="orders" className="sr-only">Orders</div>
  </div>;
}
