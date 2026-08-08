"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

export type FilterGroup = {
  id: string;
  title: string;
  options: FilterOption[];
};

interface AccordionFilterProps {
  group: FilterGroup;
  selectedValues: Set<string>;
  onToggle: (value: string) => void;
  allowMultiple?: boolean;
}

export function AccordionFilter({
  group,
  selectedValues,
  onToggle,
  allowMultiple = true,
}: AccordionFilterProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-[#d4a373]/20 py-4 first:pt-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-semibold text-[#1a0f0a] hover:text-[#d4a373] dark:text-[#f6e5d1] dark:hover:text-[#d4a373]"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{group.title}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {group.options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-[#f9f6f0] dark:hover:bg-[#1a0f0a]"
                  >
                    <input
                      type={allowMultiple ? "checkbox" : "radio"}
                      checked={isSelected}
                      onChange={() => onToggle(option.value)}
                      className="h-4 w-4 rounded border-[#d4a373] accent-[#d4a373]"
                      aria-label={`Filter by ${option.label}`}
                    />
                    <span className="flex-1 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-[#9a7c6b] dark:text-[#b5988a]">
                        ({option.count})
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  variant?: "default" | "brand";
  brandColor?: string;
}

export function FilterChip({
  label,
  onRemove,
  variant = "default",
  brandColor,
}: FilterChipProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        variant === "brand"
          ? "border border-[#d4a373]/30 bg-[#f9f6f0] text-[#1a0f0a] dark:bg-[#23110c]"
          : "border border-[#d4a373]/30 bg-white/70 text-[#1a0f0a] dark:bg-[#23110c] dark:text-[#f6e5d1]"
      }`}
      style={variant === "brand" && brandColor ? { borderColor: brandColor, backgroundColor: `${brandColor}15` } : {}}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label={`Remove ${label} filter`}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

interface FilterChipsRowProps {
  activeFilters: Array<{ id: string; label: string; variant?: "default" | "brand"; brandColor?: string }>;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
}

export function FilterChipsRow({ activeFilters, onRemove, onClearAll }: FilterChipsRowProps) {
  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f9f6f0]/50 p-3 dark:bg-[#23110c]/50"
    >
      {activeFilters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          onRemove={() => onRemove(filter.id)}
          variant={filter.variant}
          brandColor={filter.brandColor}
        />
      ))}
      {onClearAll && activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="ml-auto text-xs text-[#d4a373] hover:text-[#1a0f0a] dark:hover:text-[#f6e5d1]"
        >
          Clear all
        </button>
      )}
    </motion.div>
  );
}
