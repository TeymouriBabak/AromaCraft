"use client";

import { motion } from "framer-motion";
import { Truck, Shield, Gift, Leaf } from "lucide-react";

export function TrustStrip() {
  const trustItems = [
    {
      icon: Leaf,
      title: "Freshly Roasted",
      description: "Premium global selections",
    },
    {
      icon: Shield,
      title: "Trusted Brands",
      description: "Globally loved coffee houses",
    },
    {
      icon: Truck,
      title: "Fast Shipping",
      description: "Free over $50",
    },
    {
      icon: Gift,
      title: "Subscription Savings",
      description: "Up to 15% off recurring",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8 grid gap-4 rounded-3xl border border-[#d4a373]/20 bg-white/50 p-6 dark:bg-[#23110c]/50 sm:grid-cols-2 lg:grid-cols-4"
    >
      {trustItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className="mt-1 rounded-lg bg-[#d4a373]/10 p-2.5">
              <Icon size={20} className="text-[#d4a373]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
                {item.title}
              </h3>
              <p className="text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                {item.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-[#d4a373]/20 bg-white/50 py-16 dark:bg-[#23110c]/50"
    >
      <div className="mb-4 rounded-full bg-[#f9f6f0] p-4 dark:bg-[#1a0f0a]">
        <Leaf size={32} className="text-[#d4a373]" />
      </div>
      <h3 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">
        No products found
      </h3>
      <p className="mt-2 max-w-sm text-center text-[#6e4b33] dark:text-[#e8d8c0]">
        Try adjusting your filters or search terms to discover more premium coffees
      </p>
    </motion.div>
  );
}

export function LoadingCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#d4a373]/20 bg-white/80 dark:bg-[#23110c]">
      <div className="h-56 bg-linear-to-r from-[#efe2d2] via-[#e0d0c0] to-[#efe2d2] bg-size-[200%_100%] animate-pulse" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-24 rounded bg-[#f9f6f0] dark:bg-[#1a0f0a]" />
        <div className="h-6 w-full rounded bg-[#f9f6f0] dark:bg-[#1a0f0a]" />
        <div className="h-4 w-3/4 rounded bg-[#f9f6f0] dark:bg-[#1a0f0a]" />
        <div className="pt-2">
          <div className="h-10 w-full rounded-full bg-[#f9f6f0] dark:bg-[#1a0f0a]" />
        </div>
      </div>
    </div>
  );
}

export function ResultsToolbar({
  count,
  sortBy,
  onSortChange,
}: {
  count: number;
  sortBy: string;
  onSortChange: (value: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6 flex flex-col gap-4 rounded-3xl border border-[#d4a373]/20 bg-white/70 p-4 dark:bg-[#23110c] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center justify-between sm:block">
        <p className="text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
          Showing <span className="font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">{count}</span> products
        </p>
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm font-medium text-[#1a0f0a] dark:text-[#f6e5d1]">
          Sort by
        </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-full border border-[#d4a373]/30 bg-[#f9f6f0] px-4 py-2 text-sm outline-none transition hover:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/20 dark:bg-[#1a0f0a]"
        >
          <option value="best-selling">Best Selling</option>
          <option value="newest">Newest Arrivals</option>
          <option value="top-rated">Top Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="most-reviewed">Most Reviewed</option>
        </select>
      </div>
    </motion.div>
  );
}

interface QuickFilterChipsProps {
  filters: Array<{ id: string; label: string }>;
  activeFilter?: string;
  onSelect: (filterId: string) => void;
}

export function QuickFilterChips({ filters, activeFilter, onSelect }: QuickFilterChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6 flex flex-wrap gap-2 rounded-lg bg-white/50 p-3 dark:bg-[#23110c]/50"
    >
      {filters.map((filter) => (
        <motion.button
          key={filter.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(filter.id)}
          className={`rounded-full px-4 py-2 text-xs font-medium transition ${
            activeFilter === filter.id
              ? "bg-[#d4a373] text-white shadow-lg"
              : "border border-[#d4a373]/30 bg-white text-[#1a0f0a] hover:border-[#d4a373] dark:bg-[#1a0f0a] dark:text-[#f6e5d1]"
          }`}
        >
          {filter.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
