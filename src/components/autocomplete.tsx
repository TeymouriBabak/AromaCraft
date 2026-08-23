'use client';

import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { searchSuggestions } from '@/lib/filter-utils';
import type { Product } from '@/lib/shop-products';
import { useRouter } from 'next/navigation';

const categorySuggestions: Record<string, string[]> = {
  espresso: ['Espresso', 'Dark Roast', 'Best Sellers'],
  dark: ['Dark Roast', 'Espresso', 'Bold Flavor'],
  light: ['Light Roast', 'Single Origin', 'Citrus Notes'],
  caramel: ['Caramel', 'Smooth', 'House Blend'],
  vanilla: ['Vanilla', 'Medium Roast', 'Subscription Eligible'],
  berry: ['Berry', 'Pour Over', 'Single Origin'],
  nutty: ['Nutty', 'Blend', 'Drip Coffee'],
};

function getCategorySuggestions(query: string) {
  const lower = query.toLowerCase();
  const matched = Object.entries(categorySuggestions).find(([key]) =>
    lower.includes(key)
  );
  if (matched) return matched[1];
  return [
    'Best Sellers',
    'New Arrivals',
    'Single Origin',
    'Blends',
    'Espresso',
  ];
}

export default function Autocomplete({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<typeof products>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const listboxId = 'search-autocomplete-listbox';

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const suggestions =
    open && hasUserTyped && items.length === 0
      ? getCategorySuggestions(value)
      : [];

  const activeDescendantId =
    activeIndex >= 0 && items[activeIndex]
      ? `search-autocomplete-item-${items[activeIndex].id}`
      : undefined;

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);
    if (nextValue && nextValue.length >= 2) {
      setItems(searchSuggestions(products, nextValue, 6));
      setOpen(true);
      setHasUserTyped(true);
    } else {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      setHasUserTyped(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        router.push(`/shop/${items[activeIndex].id}`);
      }
      setOpen(false);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Search by brand, origin, roast, tasting notes, or brew method..."
        className="w-full rounded-full border border-[#d4a373]/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d4a373]/30"
        aria-label="Search products"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        role="combobox"
        onFocus={() => {
          if (value.length >= 2) {
            setItems(searchSuggestions(products, value, 6));
            setOpen(true);
            setHasUserTyped(true);
          }
        }}
        onKeyDown={onKeyDown}
      />

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl border border-[#e6d7c7] bg-white p-2 shadow-lg">
          {items.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-60 overflow-auto"
            >
              {items.map((p, index) => (
                <li
                  key={p.id}
                  id={`search-autocomplete-item-${p.id}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={`cursor-pointer rounded px-3 py-2 transition ${
                    activeIndex === index
                      ? 'bg-[#f3eadf]'
                      : 'hover:bg-[#f9f4ed]'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onClick={() => {
                    router.push(`/shop/${p.id}`);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-[#1a0f0a]">{p.name}</div>
                      <div className="text-xs text-[#6e4b33]">
                        {p.brand} • {p.size}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#1a0f0a]">
                      ${p.price.toFixed(2)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 px-3 py-2 text-sm text-[#6e4b33]">
              <p className="font-medium text-[#1a0f0a]">No matches found</p>
              <p>Try these related categories:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      onChange(suggestion);
                      setOpen(false);
                    }}
                    className="rounded-full border border-[#d4a373]/30 bg-[#f9f6f0] px-3 py-1 text-xs font-medium text-[#1a0f0a] hover:bg-[#e6d7c1]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
