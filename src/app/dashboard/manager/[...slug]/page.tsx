'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Check, ClipboardList, DollarSign, MessageSquare, Search, Users, UserRound, X } from 'lucide-react';
import { Kpi, Panel, LowStockGrid } from '@/components/manager-dashboard-components';
import { ManagerProductForm } from '@/components/manager-product-form';
import { BrandReportView, CustomerGrowthView, ProductReportView, ReportsOverviewView, RevenueReportView, type BrandData, type CustomerData, type ProductData, type RevenueData } from '@/components/manager-report-views';
import { OrdersView, RefundRequestsView } from '@/components/manager-order-views';
import { AdminManagementView, AllAdminsView, RegisterAdminView } from '@/components/manager-admin-views';
import { ApprovedReviewsView, PendingReviewsView, RejectedReviewsView, ReviewsModerationView } from '@/components/manager-review-views';
import { ProductPickerView, ShopManagementView } from '@/components/manager-shop-views';
import { ContentManagementView, FaqEntriesView, HomepageSectionsView, OurStoryView, PromotionalBannersView } from '@/components/manager-content-views';
import ManagerCustomerRegistration from '@/components/manager-customer-registration';
import type { ManagerSection } from '@/app/dashboard/layout';

type RecordValue = Record<string, unknown>;

interface TodaySnapshotData {
  snapshot: {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    newReviews: number;
    pendingReviews: number;
    inventoryAlerts: number;
    recentOrders: Array<{ id: string; total: string; status: string }>;
    lowStockItems: Array<{ id: number; name: string; brand: string; inventory: number }>;
  };
}

interface KpiCardsData {
  kpis: Array<{
    label: string;
    value: number;
    trend: number | null;
    icon: string;
    color: string;
  }>;
  lowStockItems: Array<{ id: number; name: string; brand: string; inventory: number }>;
}

interface RevenueVsTargetData {
  revenueData: Array<{ month: string; revenue: number; target: number }>;
  totalRevenue: number;
  averageDailyRevenue: number;
}

interface BrandSalesShareData {
  brandShare: Array<{
    name: string;
    value: number;
    revenue: number;
    color: string;
  }>;
  totalRevenue: number;
  topBrand: {
    name: string;
    value: number;
    revenue: number;
    color: string;
  };
}

const iconMap: Record<string, typeof DollarSign> = {
  DollarSign,
  ClipboardList,
  Users,
  MessageSquare,
  AlertTriangle,
};

import { canonicalManagerSlug } from '@/lib/manager-nav-slugs';

function normalizeSlugSegment(value: string) {
  return canonicalManagerSlug(value);
}

function resolveManagerSection(slug: string[] | undefined): ManagerSection | null {
  const pathSegments = (slug ?? []).flatMap((segment) => segment.split('/'));
  const normalizedSegments = pathSegments
    .map(normalizeSlugSegment)
    .filter(Boolean);

  if (normalizedSegments.length === 0) {
    return 'Overview';
  }

  const current = normalizedSegments[normalizedSegments.length - 1];
  const sectionMap: Record<string, ManagerSection> = {
    overview: 'Overview',
    'todays-snapshot': 'Overview',
    'kpi-cards': 'Overview',
    'revenue-vs-target': 'Overview',
    'brand-sales-share': 'Overview',
    orders: 'Orders',
    'all-orders': 'Orders',
    'pending-orders': 'Orders',
    'completed-orders': 'Orders',
    'refund-requests': 'Orders',
    refunds: 'Orders',
    inventory: 'Inventory',
    'product-list': 'Inventory',
    'low-stock-alerts': 'Inventory',
    'add-new-product': 'Inventory',
    'edit-product': 'Inventory',
    'manage-brands': 'Inventory',
    'edit-shop-filters': 'Inventory',
    'reports-analytics': 'Reports & Analytics',
    'revenue-report': 'Reports & Analytics',
    'sales-by-product': 'Reports & Analytics',
    'sales-by-brand': 'Reports & Analytics',
    'customer-growth': 'Reports & Analytics',
    analytics: 'Reports & Analytics',
    customers: 'Customers',
    'all-customers': 'Customers',
    'customer-detail-view': 'Customers',
    'customer-detail': 'Customers',
    'ban-unban': 'Customers',
    'banned-list': 'Customers',
    'admin-management': 'Admin Management',
    'all-admins': 'Admin Management',
    'register-new-admin': 'Admin Management',
    'reviews-moderation': 'Reviews Moderation',
    'pending-reviews-queue': 'Reviews Moderation',
    'approved-reviews': 'Reviews Moderation',
    'rejected-reviews': 'Reviews Moderation',
    'shop-management': 'Shop Management',
    'add-product': 'Shop Management',
    'content-management': 'Content Management',
    'homepage-sections': 'Content Management',
    'promotional-banners': 'Content Management',
    'our-story': 'Content Management',
    'faq-entries': 'Content Management',
    'register-customer': 'Register Customer',
    'customer-registration-form': 'Register Customer',
  };

  return sectionMap[current] ?? null;
}

function TodaySnapshotView({ data }: { data: TodaySnapshotData }) {
  const snapshot = data.snapshot;
  const formattedDate = new Date(snapshot.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-400">{formattedDate}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Today&apos;s snapshot</h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time overview of today&apos;s AromaCraft operations.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border-l-2 bg-[oklch(0.23_0.015_240)] p-4 shadow-lg" style={{ borderLeftColor: '#72b58d' }}>
          <div className="text-xs text-slate-400">Total Revenue</div>
          <div className="mt-4 text-2xl font-bold text-slate-100">
            ${snapshot.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="border-l-2 bg-[oklch(0.23_0.015_240)] p-4 shadow-lg" style={{ borderLeftColor: '#5ea8d6' }}>
          <div className="text-xs text-slate-400">Orders</div>
          <div className="mt-4 text-2xl font-bold text-slate-100">
            {snapshot.totalOrders}
          </div>
        </div>
        <div className="border-l-2 bg-[oklch(0.23_0.015_240)] p-4 shadow-lg" style={{ borderLeftColor: '#bd8bbd' }}>
          <div className="text-xs text-slate-400">New Customers</div>
          <div className="mt-4 text-2xl font-bold text-slate-100">
            {snapshot.newCustomers}
          </div>
        </div>
        <div className="border-l-2 bg-[oklch(0.23_0.015_240)] p-4 shadow-lg" style={{ borderLeftColor: '#e0a64d' }}>
          <div className="text-xs text-slate-400">New Reviews</div>
          <div className="mt-4 text-2xl font-bold text-slate-100">
            {snapshot.newReviews}
          </div>
        </div>
      </div>

      <Panel
        title="Recent Orders"
        description={`${snapshot.totalOrders} orders placed today`}
      >
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-80 text-left text-sm">
            <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recentOrders.length > 0 ? (
                snapshot.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/70">
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {order.id}
                    </td>
                    <td className="px-4 py-3">
                      ${Number(order.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No orders placed today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {snapshot.lowStockItems.length > 0 && (
        <Panel
          title="Low-stock alerts"
          description={`${snapshot.inventoryAlerts} items need attention`}
        >
          <LowStockGrid items={snapshot.lowStockItems} />
        </Panel>
      )}
    </>
  );
}

function KpiCardsView({ data }: { data: KpiCardsData }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">KPI Cards</h1>
          <p className="mt-2 text-sm text-slate-400">
            Key performance indicators for the last 30 days.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((kpi) => {
          const Icon = iconMap[kpi.icon] || DollarSign;
          const trend =
            kpi.trend === null
              ? undefined
              : `${kpi.trend >= 0 ? '+' : ''}${kpi.trend}%`;
          return (
            <Kpi
              key={kpi.label}
              label={kpi.label}
              value={
                kpi.label === 'Revenue'
                  ? `$${kpi.value.toLocaleString()}`
                  : kpi.value
              }
              icon={Icon}
              color={kpi.color}
              trend={trend}
            />
          );
        })}
      </div>

      {data.lowStockItems.length > 0 && (
        <Panel
          title="Low-stock alerts"
          description={`${data.lowStockItems.length} items need attention`}
        >
          <LowStockGrid items={data.lowStockItems} />
        </Panel>
      )}
    </>
  );
}

function RevenueVsTargetView({ data }: { data: RevenueVsTargetData }) {
  const hasData = Array.isArray(data.revenueData) && data.revenueData.some((point) => Number(point.revenue) > 0 || Number(point.target) > 0);
  const yDomain = hasData
    ? [0, Math.max(...data.revenueData.map((point) => Number(point.revenue ?? 0)), ...data.revenueData.map((point) => Number(point.target ?? 0))) * 1.25]
    : [0, 1];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Revenue vs Target</h1>
          <p className="mt-2 text-sm text-slate-400">
            Last 30 days revenue performance.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <Panel title="Revenue vs target" description="Last 30 days performance">
          <div className="mt-5 h-80">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueData}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    stroke="#64748b"
                  />
                  <YAxis
                    domain={yDomain}
                    tickLine={false}
                    axisLine={false}
                    stroke="#64748b"
                    tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                  <Tooltip formatter={(value: number) => [`$${Number(value).toLocaleString()}`, '']} />
                  <Area
                    name="Revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#5ea8d6"
                    fill="#5ea8d6"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    name="Target"
                    type="monotone"
                    dataKey="target"
                    stroke="#e0a64d"
                    fill="none"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-700 text-sm text-slate-400">
                No data available
              </div>
            )}
          </div>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-slate-700 bg-[oklch(0.23_0.015_240)] p-5">
            <div className="text-sm text-slate-400">Total Revenue</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              ${data.totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="border border-slate-700 bg-[oklch(0.23_0.015_240)] p-5">
            <div className="text-sm text-slate-400">Average Daily Revenue</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              ${data.averageDailyRevenue.toLocaleString()}
            </div>
          </div>
          <div className="border border-slate-700 bg-[oklch(0.23_0.015_240)] p-5">
            <div className="text-sm text-slate-400">Days Tracked</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">30</div>
          </div>
        </div>
      </div>
    </>
  );
}

function BrandSalesShareView({ data }: { data: BrandSalesShareData }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Brand Sales Share</h1>
          <p className="mt-2 text-sm text-slate-400">
            Revenue contribution by brand in the last 30 days.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel title="Brand sales share">
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.brandShare}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={82}
                  label={({ value }) => `${value}%`}
                >
                  {data.brandShare.map((brand) => (
                    <Cell key={brand.name} fill={brand.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Brand breakdown">
          <div className="mt-4 space-y-3">
            {data.brandShare.length > 0 ? (
              data.brandShare.map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-between border border-slate-700 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: brand.color }}
                    />
                    <div>
                      <div className="font-medium">{brand.name}</div>
                      <div className="text-xs text-slate-400">
                        ${brand.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-100">
                    {brand.value}%
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-4">
                No brand data available
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Summary">
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-slate-700 bg-[oklch(0.23_0.015_240)] p-4">
            <div className="text-sm text-slate-400">Total Revenue</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              ${data.totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="border border-slate-700 bg-[oklch(0.23_0.015_240)] p-4">
            <div className="text-sm text-slate-400">Top Brand</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              {data.topBrand.name}
            </div>
            <div className="text-xs text-slate-400">
              {data.topBrand.value}% share
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}

export function OrdersTableView({
  slug,
  items,
}: {
  slug: string;
  items: RecordValue[];
}) {
  const [query, setQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const title = slug
    .split('/')
    .pop()
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? 'Orders';

  const toCustomerName = (record: RecordValue): string => {
    const candidate = record as Record<string, unknown>;
    const customer = candidate.customer && typeof candidate.customer === 'object'
      ? (candidate.customer as Record<string, unknown>)
      : null;
    const user = candidate.user && typeof candidate.user === 'object'
      ? (candidate.user as Record<string, unknown>)
      : null;

    const directName = typeof candidate.customerName === 'string' ? candidate.customerName : '';
    const customerName = typeof customer?.name === 'string' ? customer.name : '';
    const userName = typeof user?.username === 'string' ? user.username : '';
    const userEmail = typeof user?.email === 'string' ? user.email : '';
    const fullName = [
      typeof user?.firstName === 'string' ? user.firstName : '',
      typeof user?.lastName === 'string' ? user.lastName : '',
    ].filter(Boolean).join(' ');

    return directName || customerName || fullName || userName || userEmail || 'Unknown customer';
  };

  const filteredOrders = items.filter((item) => {
    const record = item as Record<string, unknown>;
    const customerName = toCustomerName(record);
    const customerEmail = typeof record.customerEmail === 'string'
      ? record.customerEmail
      : typeof (record.user as Record<string, unknown> | undefined)?.email === 'string'
        ? String((record.user as Record<string, unknown>).email)
        : '';
    const itemText = [
      customerName,
      String(record.id ?? ''),
      String(record.status ?? ''),
      customerEmail,
      Array.isArray(record.items)
        ? (record.items as RecordValue[])
            .map((line) => `${String((line as Record<string, unknown>).name ?? '')} ${String((line as Record<string, unknown>).quantity ?? '')}`)
            .join(' ')
        : '',
    ].join(' ').toLowerCase();
    return itemText.includes(query.toLowerCase());
  });

  return (
    <>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
          Manager portal
        </p>
        <h1 className="mt-1 text-2xl font-bold capitalize">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live orders from the AromaCraft database.
        </p>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-2.5 text-slate-500"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}`}
          className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 text-sm text-slate-100 outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto border border-slate-700 bg-[oklch(0.23_0.015_240)]">
        <table className="w-full min-w-51.25 text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const record = order as Record<string, unknown>;
              const status = String(record.status ?? 'PENDING');
              const statusClass =
                status === 'DELIVERED'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : status === 'CANCELLED'
                    ? 'bg-red-500/10 text-red-400'
                    : status === 'PROCESSING' || status === 'SHIPPED'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-sky-500/10 text-sky-300';
              const customerName = toCustomerName(record);
              const customerEmail = typeof record.customerEmail === 'string'
                ? record.customerEmail
                : typeof (record.user as Record<string, unknown> | undefined)?.email === 'string'
                  ? String((record.user as Record<string, unknown>).email)
                  : '';
              const createdAt = record.createdAt ? new Date(String(record.createdAt)) : null;
              const formattedDate = createdAt && !Number.isNaN(createdAt.getTime())
                ? createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';
              const total = Number(record.total ?? 0);
              const itemList = Array.isArray(record.items) ? (record.items as RecordValue[]) : [];

              return (
                <Fragment key={String(order.id)}>
                  <tr className="border-b border-slate-700/70 align-top">
                    <td className="px-4 py-3 font-medium text-slate-100">{String(order.id)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{customerName}</div>
                      {customerEmail && <div className="text-xs text-slate-400">{customerEmail}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formattedDate}</td>
                    <td className="px-4 py-3 text-slate-200">${Number.isFinite(total) ? total.toLocaleString() : '0'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedOrder((current) => current === String(order.id) ? null : String(order.id))}
                        className="text-sky-400 hover:text-sky-300"
                      >
                        {expandedOrder === String(order.id) ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === String(order.id) && (
                    <tr className="border-b border-slate-700/70 bg-slate-900/40">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="space-y-2">
                          <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Order details</div>
                          {itemList.length > 0 ? (
                            <ul className="space-y-2 text-sm text-slate-300">
                              {itemList.map((item, index) => {
                                const itemRecord = item as Record<string, unknown>;
                                const itemName = String(itemRecord.name ?? (itemRecord.product && typeof itemRecord.product === 'object' ? String((itemRecord.product as Record<string, unknown>).name ?? 'AromaCraft item') : 'AromaCraft item'));
                                const itemQuantity = Number(itemRecord.quantity ?? 0);
                                const itemPrice = Number(itemRecord.price ?? itemRecord.unitPrice ?? 0);
                                return (
                                  <li key={`${String(order.id)}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                                    <span>
                                      {itemName} × {itemQuantity}
                                    </span>
                                    <span>${itemPrice.toLocaleString()}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">No order items available.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <p className="p-6 text-sm text-slate-400">No records found.</p>
      )}
    </>
  );
}

function GenericTableView({
  slug,
  items,
}: {
  slug: string;
  items: RecordValue[];
}) {
  const [query, setQuery] = useState('');
  const title = slug.split('/').pop()?.replace(/-/g, ' ') ?? 'Manager data';

  async function toggleBan(id: string) {
    const response = await fetch(`/api/manager/customers/${id}/ban`, {
      method: 'PATCH',
    });
    if (!response.ok) return;
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-400">
          Manager portal
        </p>
        <h1 className="mt-1 text-2xl font-bold capitalize">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live records from the AromaCraft database.
        </p>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-2.5 text-slate-500"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}`}
          className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 text-sm text-slate-100 outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto border border-slate-700 bg-[oklch(0.23_0.015_240)]">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
              {slug.includes('customer') && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {items
              .filter((item) => {
                const name = String(
                  item.name ??
                    (
                      [item.firstName, item.lastName]
                        .filter(Boolean)
                        .join(' ') || item.username || item.email || ''
                    )
                );
                return name.toLowerCase().includes(query.toLowerCase());
              })
              .map((item, index) => {
                const id = String(item.id ?? index);
                const name = String(
                  item.name ??
                    (
                      [item.firstName, item.lastName]
                        .filter(Boolean)
                        .join(' ') || item.username || item.email || id
                    )
                );
                const banned = Boolean(item.isBanned);
                return (
                  <tr
                    key={id}
                    className="border-b border-slate-700/70"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <UserRound size={15} className="text-sky-400" />
                        {name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {banned ? (
                        <span className="text-red-400">
                          <X size={14} className="mr-1 inline" />
                          Banned
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          <Check size={14} className="mr-1 inline" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {String(
                        item.email ??
                          item.brand ??
                          item.status ??
                          item.createdAt ??
                          'Live record'
                      )}
                    </td>
                    {slug.includes('customer') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void toggleBan(id)}
                          className="text-sky-400 hover:text-sky-300"
                        >
                          {banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="p-6 text-sm text-slate-400">No records found.</p>
      )}
    </>
  );
}

type InventorySummaryData = {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  lowStockCount: number;
  outOfStock: number;
  activeBrands: number;
  totalStockUnits: number;
  inventoryValue: number;
};

type ProductListData = {
  items: Array<RecordValue & { id: number; name: string; brand: string; price: number; inventory: number; lowStockThreshold: number; status: string; slug: string; image?: string; description?: string }>;
  page: number;
  pageSize: number;
  total: number;
};

type BrandListData = { items: Array<RecordValue & { id: string; name: string; description?: string; isActive?: boolean; slug?: string; productCount?: number }> };

type ShopFilterListData = { items: Array<RecordValue & { id: string; key: string; label: string; type: string; options?: Array<{ value: string; label: string }>; sortOrder?: number; isVisible?: boolean }> };

function InventoryOverviewView({ data }: { data: InventorySummaryData }) {
  const router = useRouter();
  const cards = [
    { label: 'Total products', value: data.totalProducts.toLocaleString(), accent: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    { label: 'Active products', value: data.activeProducts.toLocaleString(), accent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    { label: 'Low stock', value: data.lowStockCount.toLocaleString(), accent: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    { label: 'Out of stock', value: data.outOfStock.toLocaleString(), accent: 'bg-red-500/15 text-red-300 border-red-500/30' },
  ];

  return (
    <>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
        <h1 className="mt-1 text-2xl font-bold">Inventory overview</h1>
        <p className="mt-2 text-sm text-slate-400">Real stock health and product coverage from the live database.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.accent}`}>
            <div className="text-xs uppercase tracking-[0.12em] opacity-80">{card.label}</div>
            <div className="mt-3 text-3xl font-bold text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-5">
          <div className="text-sm text-slate-400">Inventory value</div>
          <div className="mt-2 text-3xl font-bold text-slate-100">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.inventoryValue)}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-5">
          <div className="text-sm text-slate-400">Stock units</div>
          <div className="mt-2 text-3xl font-bold text-slate-100">{data.totalStockUnits.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-5">
          <div className="text-sm text-slate-400">Active brands</div>
          <div className="mt-2 text-3xl font-bold text-slate-100">{data.activeBrands}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button type="button" onClick={() => router.push('/dashboard/manager/product-list')} className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-left text-sm text-sky-200 hover:bg-sky-500/15">Product list</button>
        <button type="button" onClick={() => router.push('/dashboard/manager/low-stock-alerts')} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200 hover:bg-amber-500/15">Low stock alerts</button>
        <button type="button" onClick={() => router.push('/dashboard/manager/manage-brands')} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-left text-sm text-emerald-200 hover:bg-emerald-500/15">Manage brands</button>
        <button type="button" onClick={() => router.push('/dashboard/manager/add-new-product')} className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-left text-sm text-violet-200 hover:bg-violet-500/15">Add new product</button>
        <button type="button" onClick={() => router.push('/dashboard/manager/edit-shop-filters')} className="rounded-lg border border-pink-500/40 bg-pink-500/10 px-4 py-3 text-left text-sm text-pink-200 hover:bg-pink-500/15">Edit shop filters</button>
      </div>
    </>
  );
}

function ProductListView({ data }: { data: ProductListData }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return data.items;
    return data.items.filter((item) => [item.name, item.brand, item.slug, item.status].join(' ').toLowerCase().includes(value));
  }, [data.items, query]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
          <h1 className="mt-1 text-2xl font-bold">Product list</h1>
        </div>
        <button type="button" onClick={() => router.push('/dashboard/manager/add-new-product')} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Add product</button>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 text-sm text-slate-100 outline-none" />
      </div>

      <div className="mt-4 overflow-x-auto border border-slate-700 bg-[oklch(0.23_0.015_240)]">
        <table className="w-full min-w-190 text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-slate-700/70 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.slug}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{item.brand}</td>
                <td className="px-4 py-3 text-slate-200">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(item.price))}</td>
                <td className="px-4 py-3 text-slate-200">{item.inventory}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : item.status === 'draft' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-600/40 text-slate-300'}`}>{item.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => router.push(`/dashboard/manager/edit-product?id=${item.id}`)} className="text-sky-400 hover:text-sky-300">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p className="p-6 text-sm text-slate-400">No products found.</p>}
    </>
  );
}

function LowStockView({ items }: { items: Array<RecordValue & { id: number; name: string; brand: string; inventory: number; lowStockThreshold: number }> }) {
  return (
    <>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
        <h1 className="mt-1 text-2xl font-bold">Low stock alerts</h1>
      </div>
      <div className="mt-4 overflow-x-auto border border-slate-700 bg-[oklch(0.23_0.015_240)]">
        <table className="w-full min-w-175 text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Threshold</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const severity = item.inventory <= 0 ? 'Out of stock' : 'Low stock';
              return (
                <tr key={item.id} className="border-b border-slate-700/70">
                  <td className="px-4 py-3 font-medium text-slate-100">{item.name}</td>
                  <td className="px-4 py-3 text-slate-300">{item.brand}</td>
                  <td className="px-4 py-3 text-slate-200">{item.inventory}</td>
                  <td className="px-4 py-3 text-slate-300">{item.lowStockThreshold}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${item.inventory <= 0 ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>{severity}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="p-6 text-sm text-slate-400">No low-stock products.</p>}
    </>
  );
}

function BrandManagementView({ data }: { data: BrandListData }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [brands, setBrands] = useState(data.items);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch('/api/manager/brands');
    const body = await response.json();
    setBrands(Array.isArray(body?.data?.items) ? body.data.items : Array.isArray(body?.items) ? body.items : []);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!name.trim()) {
      setError('Brand name is required.');
      return;
    }
    const response = await fetch(editingId ? `/api/manager/brands/${editingId}` : '/api/manager/brands', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, isActive: true }) });
    const body = await response.json();
    if (!response.ok || body?.ok === false) {
      setError(body?.error?.message || 'Unable to create brand.');
      return;
    }
    setName('');
    setDescription('');
    setEditingId(null);
    setMessage(editingId ? 'Brand updated.' : 'Brand created.');
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this brand?')) return;
    const response = await fetch(`/api/manager/brands/${id}`, { method: 'DELETE' });
    const body = await response.json();
    if (!response.ok || body?.ok === false) {
      setError(body?.error?.message || 'Unable to delete brand.');
      return;
    }
    setMessage('Brand deleted.');
    await refresh();
  }

  async function handleToggle(id: string, isActive: boolean) {
    setError('');
    const response = await fetch(`/api/manager/brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: brands.find((brand) => String(brand.id) === id)?.name ?? '', isActive: !isActive }) });
    const body = await response.json();
    if (!response.ok || body?.ok === false) { setError(body?.error?.message || 'Unable to update brand.'); return; }
    setMessage('Brand status updated.');
    await refresh();
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
        <h1 className="mt-1 text-2xl font-bold">Manage brands</h1>
      </div>

      <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-4">
        {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
        {message && <p className="mb-3 text-sm text-emerald-300">{message}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none" /></label>
          <label className="text-sm text-slate-300">Description<input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none" /></label>
        </div>
        <div className="mt-4 flex justify-end gap-3">{editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setDescription(''); }} className="rounded-md border border-slate-600 px-4 py-2 text-sm">Cancel edit</button>}<button type="submit" className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">{editingId ? 'Update brand' : 'Save brand'}</button></div>
      </form>

      <div className="overflow-x-auto border border-slate-700 bg-[oklch(0.23_0.015_240)]">
        <table className="w-full min-w-162.5 text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Description</th><th scope="col" className="px-4 py-3">Products</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Action</th></tr></thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-b border-slate-700/70">
                <td className="px-4 py-3 font-medium text-slate-100">{brand.name}</td>
                <td className="px-4 py-3 text-slate-300">{brand.description || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{Number(brand.productCount ?? 0)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${brand.isActive === false ? 'bg-slate-600/30 text-slate-200' : 'bg-emerald-500/10 text-emerald-300'}`}>{brand.isActive === false ? 'Inactive' : 'Active'}</span></td>
                <td className="px-4 py-3"><div className="flex gap-3"><button type="button" onClick={() => { setEditingId(String(brand.id)); setName(brand.name); setDescription(brand.description || ''); }} className="text-sky-300 hover:text-sky-200">Edit</button><button type="button" onClick={() => void handleToggle(String(brand.id), brand.isActive !== false)} className="text-sky-300 hover:text-sky-200">{brand.isActive === false ? 'Enable' : 'Disable'}</button><button type="button" onClick={() => void handleDelete(String(brand.id))} className="text-red-300 hover:text-red-200">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ShopFilterView({ data }: { data: ShopFilterListData }) {
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('select');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(data.items);

  async function refresh() {
    const response = await fetch('/api/manager/shop-filters');
    const body = await response.json();
    setFilters(Array.isArray(body?.data?.items) ? body.data.items : Array.isArray(body?.items) ? body.items : []);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!key.trim() || !label.trim()) {
      setError('Key and label are required.');
      return;
    }
    const response = await fetch('/api/manager/shop-filters', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key.trim(), label: label.trim(), type, options: [], sortOrder: 0, isVisible: true }) });
    const body = await response.json();
    if (!response.ok || body?.ok === false) {
      setError(body?.error?.message || 'Unable to save shop filter.');
      return;
    }
    setKey('');
    setLabel('');
    setType('select');
    setMessage('Shop filter saved.');
    await refresh();
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
        <h1 className="mt-1 text-2xl font-bold">Edit shop filters</h1>
      </div>

      <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-4">
        {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
        {message && <p className="mb-3 text-sm text-emerald-300">{message}</p>}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-300">Key<input value={key} onChange={(event) => setKey(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none" /></label>
          <label className="text-sm text-slate-300">Label<input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none" /></label>
          <label className="text-sm text-slate-300">Type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none"><option value="select">Select</option><option value="range">Range</option><option value="checkbox">Checkbox</option></select></label>
        </div>
        <div className="mt-4 flex justify-end"><button type="submit" className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Save filter</button></div>
      </form>

      <div className="overflow-x-auto border border-slate-700 bg-[oklch(0.23_0.015_240)]">
        <table className="w-full min-w-162.5 text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-4 py-3">Key</th><th scope="col" className="px-4 py-3">Label</th><th scope="col" className="px-4 py-3">Type</th><th scope="col" className="px-4 py-3">Visible</th><th scope="col" className="px-4 py-3">Action</th></tr></thead>
          <tbody>
            {filters.map((filter) => (
              <tr key={filter.id} className="border-b border-slate-700/70">
                <td className="px-4 py-3 font-medium text-slate-100">{filter.key}</td>
                <td className="px-4 py-3 text-slate-300">{filter.label}</td>
                <td className="px-4 py-3 text-slate-300">{filter.type}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${filter.isVisible === false ? 'bg-slate-600/30 text-slate-200' : 'bg-emerald-500/10 text-emerald-300'}`}>{filter.isVisible === false ? 'Hidden' : 'Visible'}</span></td>
                <td className="px-4 py-3"><button type="button" onClick={() => { setKey(filter.key); setLabel(filter.label); setType(filter.type as 'select' | 'range' | 'checkbox'); }} className="text-sky-300 hover:text-sky-200">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EditProductView({ productId }: { productId?: number | null }) {
  const [product, setProduct] = useState<RecordValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) {
      return;
    }

    fetch(`/api/manager/products/${productId}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || body?.ok === false) {
          throw new Error(body?.error?.message || 'Unable to load product.');
        }
        setProduct((body?.data?.product ?? body?.product ?? null) as RecordValue | null);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load product.');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (!productId) {
    return <div className="rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-6 text-sm text-slate-300">{error || 'Select a product to edit.'}</div>;
  }

  if (loading) {
    return <div className="p-4 text-sm text-slate-400">Loading product...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>;
  }

  return <ManagerProductForm defaultValues={product as never} mode="edit" productId={productId} />;
}

export default function ManagerSubPage() {
  const params = useParams<{ slug: string[] }>();
  const searchParams = useSearchParams();
  const routeSegments = (params?.slug ?? [])
    .flatMap((segment) => segment.split('/'))
    .map((segment) => canonicalManagerSlug(segment))
    .filter(Boolean);

  const pageKey = routeSegments.length > 1 && ['orders', 'inventory', 'customers', 'reports-analytics', 'admin-management', 'reviews-moderation', 'shop-management', 'content-management', 'register-customer'].includes(routeSegments[0])
    ? routeSegments.slice(1).join('-')
    : routeSegments.join('-');

  const normalizedSlug = pageKey || 'overview';
  const activeSection = resolveManagerSection([normalizedSlug]);
  const productId = Number(searchParams?.get('id') ?? '0') || undefined;

  const [data, setData] = useState<
    | TodaySnapshotData
    | KpiCardsData
    | RevenueVsTargetData
    | BrandSalesShareData
    | { items?: RecordValue[]; data?: { items?: RecordValue[] } }
    | null
  >(null);
  const [items, setItems] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(!['add-new-product', 'edit-product', 'register-new-admin', 'register-customer', 'customer-registration-form'].includes(normalizedSlug));
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const apiEndpoint = (() => {
      if (normalizedSlug === 'todays-snapshot') return '/api/manager/today-snapshot';
      if (normalizedSlug === 'kpi-cards') return '/api/manager/kpi-cards';
      if (normalizedSlug === 'revenue-vs-target') return '/api/manager/revenue-vs-target';
      if (normalizedSlug === 'brand-sales-share') return '/api/manager/brand-sales-share';
      if (normalizedSlug === 'all-orders') return '/api/manager/orders?status=ALL&pageSize=100';
      if (normalizedSlug === 'pending-orders') return '/api/manager/orders?status=pending&pageSize=100';
      if (normalizedSlug === 'completed-orders') return '/api/manager/orders?status=completed&pageSize=100';
      if (normalizedSlug === 'refund-requests' || normalizedSlug === 'refunds') return '/api/manager/refund-requests';
      if (normalizedSlug === 'inventory') return '/api/manager/inventory/summary';
      if (normalizedSlug === 'product-list') return '/api/manager/products';
      if (normalizedSlug === 'low-stock-alerts') return '/api/manager/inventory/low-stock';
      if (normalizedSlug === 'manage-brands') return '/api/manager/brands';
      if (normalizedSlug === 'edit-shop-filters') return '/api/manager/shop-filters';
      if (normalizedSlug === 'categories') return '/api/manager/categories';
      if (normalizedSlug === 'coupons') return '/api/manager/coupons';
      if (normalizedSlug === 'reports-analytics') return '/api/manager/overview';
      if (normalizedSlug === 'revenue-report') return '/api/manager/reports/revenue';
      if (normalizedSlug === 'sales-by-product') return '/api/manager/reports/sales-by-product';
      if (normalizedSlug === 'sales-by-brand') return '/api/manager/reports/sales-by-brand';
      if (normalizedSlug === 'customer-growth') return '/api/manager/reports/customer-growth';
      if (normalizedSlug === 'register-customer' || normalizedSlug === 'customer-registration-form') return '/api/manager/customers?limit=1';
      if (normalizedSlug === 'shop-management') return '/api/manager/products?page=1&pageSize=100';
      if (['content-management', 'homepage-sections', 'promotional-banners', 'our-story', 'faq-entries'].includes(normalizedSlug)) return '/api/manager/content/overview';
      if (normalizedSlug === 'reviews-moderation') return '/api/manager/reviews/stats';
      if (normalizedSlug === 'pending-reviews-queue') return '/api/manager/reviews?status=pending&page=1&pageSize=100';
      if (normalizedSlug === 'approved-reviews') return '/api/manager/reviews?status=approved&page=1&pageSize=100';
      if (normalizedSlug === 'rejected-reviews') return '/api/manager/reviews?status=rejected&page=1&pageSize=100';
      if (normalizedSlug === 'settings') return '/api/manager/settings';
      if (normalizedSlug === 'admin-management' || normalizedSlug === 'all-admins') return '/api/manager/admins?page=1&pageSize=100';
      return `/api/manager/${normalizedSlug}`;
    })();

    if (normalizedSlug === 'add-new-product' || (normalizedSlug === 'edit-product' && !productId) || normalizedSlug === 'register-new-admin' || normalizedSlug === 'register-customer' || normalizedSlug === 'customer-registration-form' || ['content-management', 'homepage-sections', 'promotional-banners', 'our-story', 'faq-entries'].includes(normalizedSlug)) {
      return () => controller.abort();
    }

    fetch(apiEndpoint, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();

        if (body && typeof body === 'object' && body.ok === false) {
          const errorMsg = body.error?.message || 'API error';
          throw new Error(errorMsg);
        }

        if (!response.ok) {
          throw new Error('Unable to load manager data');
        }

        const unwrappedData = body.data ?? body;
        setData(unwrappedData);

        if (!normalizedSlug.match(/(todays-snapshot|kpi-cards|revenue-vs-target|brand-sales-share|reports-analytics|revenue-report|sales-by-product|sales-by-brand|customer-growth)/)) {
          const nextItems =
            unwrappedData.items ??
            unwrappedData.data?.items ??
            (Array.isArray(unwrappedData.data) ? unwrappedData.data : undefined) ??
            unwrappedData.orders ??
            unwrappedData.data?.orders ??
            [];
          setItems(Array.isArray(nextItems) ? nextItems : []);
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== 'AbortError') {
          setError(reason.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [normalizedSlug, productId]);

  if (normalizedSlug === 'add-new-product') {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
          <h1 className="mt-1 text-2xl font-bold">Add new product</h1>
        </div>
        <ManagerProductForm />
      </main>
    );
  }

  if (normalizedSlug === 'edit-product' && productId) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.16em] text-sky-400">Inventory</p>
          <h1 className="mt-1 text-2xl font-bold">Edit product</h1>
        </div>
        <EditProductView productId={productId} />
      </main>
    );
  }

  if (loading && normalizedSlug !== 'register-new-admin') {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7">
        <div className="grid gap-2">
          {[1, 2, 3].map((value) => (
            <div key={value} className="h-14 animate-pulse bg-slate-800" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7">
        <p className="text-sm text-red-400">{error}</p>
      </main>
    );
  }

  if (activeSection === null) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7">
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">
            Unknown dashboard section: <code className="text-slate-300">{normalizedSlug}</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[oklch(0.18_0.01_240)] p-4 text-slate-100 sm:p-7">
      {normalizedSlug === 'todays-snapshot' && data && 'snapshot' in data && (
        <TodaySnapshotView data={data as TodaySnapshotData} />
      )}
      {normalizedSlug === 'kpi-cards' && data && 'kpis' in data && (
        <KpiCardsView data={data as KpiCardsData} />
      )}
      {normalizedSlug === 'revenue-vs-target' && data && 'revenueData' in data && (
        <RevenueVsTargetView data={data as RevenueVsTargetData} />
      )}
      {normalizedSlug === 'brand-sales-share' && data && 'brandShare' in data && (
        <BrandSalesShareView data={data as BrandSalesShareData} />
      )}
      {normalizedSlug === 'reports-analytics' && data && 'overview' in data && (
        <ReportsOverviewView data={{ ...(data.overview as Record<string, unknown>), topBrand: String((data.overview as Record<string, unknown>).brandShare && Array.isArray((data.overview as Record<string, unknown>).brandShare) ? ((data.overview as Record<string, unknown>).brandShare as Array<Record<string, unknown>>)[0]?.name ?? '' : '') }} />
      )}
      {normalizedSlug === 'revenue-report' && data && 'series' in data && <RevenueReportView data={data as RevenueData} />}
      {normalizedSlug === 'sales-by-brand' && data && 'brands' in data && <BrandReportView data={data as BrandData} />}
      {normalizedSlug === 'sales-by-product' && data && 'items' in data && <ProductReportView data={data as ProductData} />}
      {normalizedSlug === 'customer-growth' && data && 'series' in data && <CustomerGrowthView data={data as CustomerData} />}
      {normalizedSlug === 'reviews-moderation' && <ReviewsModerationView />}
      {normalizedSlug === 'pending-reviews-queue' && <PendingReviewsView />}
      {normalizedSlug === 'approved-reviews' && <ApprovedReviewsView />}
      {normalizedSlug === 'rejected-reviews' && <RejectedReviewsView />}
      {normalizedSlug === 'shop-management' && <ShopManagementView />}
      {normalizedSlug === 'content-management' && <ContentManagementView />}
      {normalizedSlug === 'homepage-sections' && <HomepageSectionsView />}
      {normalizedSlug === 'promotional-banners' && <PromotionalBannersView />}
      {normalizedSlug === 'our-story' && <OurStoryView />}
      {normalizedSlug === 'faq-entries' && <FaqEntriesView />}
      {(normalizedSlug === 'register-customer' || normalizedSlug === 'customer-registration-form') && <ManagerCustomerRegistration />}
      {normalizedSlug === 'edit-product' && !productId && <ProductPickerView />}
      {normalizedSlug === 'admin-management' && <AdminManagementView />}
      {normalizedSlug === 'all-admins' && <AllAdminsView />}
      {normalizedSlug === 'register-new-admin' && <RegisterAdminView />}
      {['all-orders', 'pending-orders', 'completed-orders'].includes(normalizedSlug) && (
        <OrdersView title={normalizedSlug === 'all-orders' ? 'All orders' : normalizedSlug === 'pending-orders' ? 'Pending orders' : 'Completed orders'} items={items as Array<{ id: string; customerName?: string; customerEmail?: string | null; createdAt?: string; total?: number; status?: string; items?: Array<{ name?: string; quantity?: number }> }>} />
      )}
      {(normalizedSlug === 'refund-requests' || normalizedSlug === 'refunds') && (
        <RefundRequestsView initialItems={items as Array<{ id: string; requestId: string; orderId: string; customerName: string; customerEmail?: string | null; reason: string; amount: number; status: string; requestedAt: string }>} />
      )}
      {normalizedSlug === 'inventory' && data && 'totalProducts' in data && (
        <InventoryOverviewView data={data as InventorySummaryData} />
      )}
      {normalizedSlug === 'product-list' && data && 'items' in data && (
        <ProductListView data={data as ProductListData} />
      )}
      {normalizedSlug === 'low-stock-alerts' && items.length >= 0 && (
        <LowStockView items={items as Array<RecordValue & { id: number; name: string; brand: string; inventory: number; lowStockThreshold: number }>} />
      )}
      {normalizedSlug === 'manage-brands' && data && 'items' in data && (
        <BrandManagementView data={data as BrandListData} />
      )}
      {normalizedSlug === 'edit-shop-filters' && data && 'items' in data && (
        <ShopFilterView data={data as ShopFilterListData} />
      )}
      {normalizedSlug === 'categories' && data && 'items' in data && (
        <GenericTableView slug={normalizedSlug} items={data.items as RecordValue[]} />
      )}
      {normalizedSlug === 'coupons' && data && 'items' in data && (
        <GenericTableView slug={normalizedSlug} items={data.items as RecordValue[]} />
      )}
      {normalizedSlug === 'settings' && data && 'settings' in data && (
        <div className="rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p><span className="text-slate-500">Business name:</span> {String((data.settings as Record<string, unknown>).businessName ?? 'AromaCraft')}</p>
            <p><span className="text-slate-500">Support email:</span> {String((data.settings as Record<string, unknown>).supportEmail ?? 'support@aromacraft.com')}</p>
            <p><span className="text-slate-500">Timezone:</span> {String((data.settings as Record<string, unknown>).timezone ?? 'UTC')}</p>
          </div>
        </div>
      )}
      {normalizedSlug === 'analytics' && data && 'summary' in data && (
        <div className="rounded-lg border border-slate-700 bg-[oklch(0.23_0.015_240)] p-6">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-700 p-4"><div className="text-xs uppercase tracking-[0.12em] text-slate-400">Revenue</div><div className="mt-2 text-2xl font-bold">${Number((data.summary as Record<string, unknown>).totalRevenue ?? 0).toLocaleString()}</div></div>
            <div className="rounded-md border border-slate-700 p-4"><div className="text-xs uppercase tracking-[0.12em] text-slate-400">Orders</div><div className="mt-2 text-2xl font-bold">{Number((data.summary as Record<string, unknown>).totalOrders ?? 0)}</div></div>
            <div className="rounded-md border border-slate-700 p-4"><div className="text-xs uppercase tracking-[0.12em] text-slate-400">Avg. order</div><div className="mt-2 text-2xl font-bold">${Number((data.summary as Record<string, unknown>).averageOrderValue ?? 0).toLocaleString()}</div></div>
          </div>
        </div>
      )}
      {normalizedSlug === 'add-new-product' && <ManagerProductForm />}
      {normalizedSlug === 'edit-product' && productId && <EditProductView productId={productId} />}

      {!normalizedSlug.match(/(todays-snapshot|kpi-cards|revenue-vs-target|brand-sales-share|reports-analytics|revenue-report|sales-by-product|sales-by-brand|customer-growth|admin-management|all-admins|register-new-admin|reviews-moderation|pending-reviews-queue|approved-reviews|rejected-reviews|shop-management|content-management|homepage-sections|promotional-banners|our-story|faq-entries|register-customer|customer-registration-form|inventory|product-list|low-stock-alerts|manage-brands|edit-shop-filters|categories|coupons|analytics|settings|add-new-product|edit-product|all-orders|pending-orders|completed-orders|refund-requests|refunds)/) && (
        <GenericTableView slug={normalizedSlug} items={items} />
      )}

      {normalizedSlug.match(/(todays-snapshot|kpi-cards|revenue-vs-target|brand-sales-share)/) &&
        !data && (
        <div className="text-center py-8">
          <p className="text-sm text-red-400">
            Error loading dashboard section: {normalizedSlug}
          </p>
        </div>
      )}
    </main>
  );
}