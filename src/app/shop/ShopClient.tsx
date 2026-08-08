"use client";

import Image from "next/image";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Menu,
} from "lucide-react";
import { products } from "@/data/products-multi-brand";
import { COFFEE_BRANDS } from "@/data/coffee-brands";
import {
  ROAST_LEVELS,
  PROCESSES,
  ORIGINS,
  BREW_METHODS,
  FLAVOR_NOTES,
  COFFEE_TYPES,
  BODY_LEVELS,
  ACIDITY_LEVELS,
  SWEETNESS_LEVELS,
  SIZES,
  GRIND_OPTIONS,
  SPECIAL_TAGS,
} from "@/data/coffee-brands";
import {
  filterProducts,
  sortProducts,
  countFilterOptions,
  getActiveFilterLabels,
  EMPTY_FILTER_STATE,
  type FilterState,
  type SortOption,
} from "@/lib/filter-utils";
import Autocomplete from "@/components/autocomplete";
import { AccordionFilter, FilterChipsRow, type FilterGroup } from "@/components/filter-components";
import { ProductCard } from "@/components/product-card";
import {
  TrustStrip,
  EmptyState,
  LoadingCard,
  ResultsToolbar,
  QuickFilterChips,
} from "@/components/shop-ui-components";
import { useWishlist } from "@/components/wishlist-context";

function buildFilterStateFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): FilterState {
  const nextState = {
    ...EMPTY_FILTER_STATE,
    brands: new Set<string>(),
    roastLevels: new Set<string>(),
    processes: new Set<string>(),
    origins: new Set<string>(),
    brewMethods: new Set<string>(),
    flavorNotes: new Set<string>(),
    coffeeTypes: new Set<string>(),
    bodyLevels: new Set<string>(),
    acidityLevels: new Set<string>(),
    sweetnessLevels: new Set<string>(),
    sizes: new Set<string>(),
    grindOptions: new Set<string>(),
    specialTags: new Set<string>(),
    searchQuery: "",
    inStockOnly: false,
  } satisfies FilterState;

  if (!searchParams) {
    return nextState;
  }

  const params = Object.fromEntries(Array.from(searchParams.entries()));
  const queryParams = params as Partial<Record<"brands" | "roast" | "brew" | "tags" | "search" | "sort", string>>;

  if (queryParams.brands) {
    nextState.brands = new Set(queryParams.brands.split(",").filter(Boolean));
  }
  if (queryParams.roast) nextState.roastLevels = new Set(queryParams.roast.split(",").filter(Boolean));
  if (queryParams.brew) nextState.brewMethods = new Set(queryParams.brew.split(",").filter(Boolean));
  if (queryParams.tags) nextState.specialTags = new Set(queryParams.tags.split(",").filter(Boolean));
  if (queryParams.search) nextState.searchQuery = queryParams.search;

  return nextState;
}

function getSortFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): SortOption {
  if (!searchParams) {
    return "best-selling";
  }

  const params = Object.fromEntries(Array.from(searchParams.entries()));
  const queryParams = params as Partial<Record<"sort", string>>;
  return (queryParams.sort as SortOption | undefined) ?? "best-selling";
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterState, setFilterState] = useState<FilterState>(() => buildFilterStateFromSearchParams(searchParams));
  const [sortBy, setSortBy] = useState<SortOption>(() => getSortFromSearchParams(searchParams));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | undefined>();
  const { itemIds: wishlistItemIdsArray, toggleWishlist } = useWishlist();
  const wishlistItemIds = useMemo(() => new Set(wishlistItemIdsArray), [wishlistItemIdsArray]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [filterState, sortBy]);

  const filteredAndSorted = useMemo(() => {
    const filtered = filterProducts(products, filterState);
    return sortProducts(filtered, sortBy);
  }, [filterState, sortBy]);

  const activeFilterLabels = useMemo(() => {
    return getActiveFilterLabels(filterState);
  }, [filterState]);

  const filterGroups = useMemo((): FilterGroup[] => {
    const brandsCount = countFilterOptions(products, "brands", filterState);
    const roastCount = countFilterOptions(products, "roastLevels", filterState);
    const processCount = countFilterOptions(products, "processes", filterState);
    const originCount = countFilterOptions(products, "origins", filterState);
    const brewCount = countFilterOptions(products, "brewMethods", filterState);
    const flavorCount = countFilterOptions(products, "flavorNotes", filterState);
    const typeCount = countFilterOptions(products, "coffeeTypes", filterState);
    const bodyCount = countFilterOptions(products, "bodyLevels", filterState);
    const acidityCount = countFilterOptions(products, "acidityLevels", filterState);
    const sweetnessCount = countFilterOptions(products, "sweetnessLevels", filterState);
    const sizeCount = countFilterOptions(products, "sizes", filterState);
    const grindCount = countFilterOptions(products, "grindOptions", filterState);
    const tagCount = countFilterOptions(products, "specialTags", filterState);

    return [
      {
        id: "brands",
        title: "Brand",
        options: COFFEE_BRANDS.map((brand) => ({
          label: brand.displayName,
          value: brand.id,
          count: brandsCount.get(brand.id) || 0,
        })),
      },
      {
        id: "roastLevels",
        title: "Roast Level",
        options: Array.from(ROAST_LEVELS).map((level) => ({
          label: level,
          value: level,
          count: roastCount.get(level) || 0,
        })),
      },
      {
        id: "coffeeTypes",
        title: "Coffee Type",
        options: Array.from(COFFEE_TYPES).map((type) => ({
          label: type,
          value: type,
          count: typeCount.get(type) || 0,
        })),
      },
      {
        id: "processes",
        title: "Process",
        options: Array.from(PROCESSES).map((process) => ({
          label: process,
          value: process,
          count: processCount.get(process) || 0,
        })),
      },
      {
        id: "origins",
        title: "Origin Region",
        options: Array.from(ORIGINS).map((origin) => ({
          label: origin,
          value: origin,
          count: originCount.get(origin) || 0,
        })),
      },
      {
        id: "brewMethods",
        title: "Brew Method",
        options: Array.from(BREW_METHODS).map((method) => ({
          label: method,
          value: method,
          count: brewCount.get(method) || 0,
        })),
      },
      {
        id: "flavorNotes",
        title: "Flavor Notes",
        options: Array.from(FLAVOR_NOTES).map((note) => ({
          label: note,
          value: note,
          count: flavorCount.get(note) || 0,
        })),
      },
      {
        id: "bodyLevels",
        title: "Body",
        options: Array.from(BODY_LEVELS).map((body) => ({
          label: body,
          value: body,
          count: bodyCount.get(body) || 0,
        })),
      },
      {
        id: "acidityLevels",
        title: "Acidity",
        options: Array.from(ACIDITY_LEVELS).map((acidity) => ({
          label: acidity,
          value: acidity,
          count: acidityCount.get(acidity) || 0,
        })),
      },
      {
        id: "sweetnessLevels",
        title: "Sweetness",
        options: Array.from(SWEETNESS_LEVELS).map((sweetness) => ({
          label: sweetness,
          value: sweetness,
          count: sweetnessCount.get(sweetness) || 0,
        })),
      },
      {
        id: "sizes",
        title: "Size / Format",
        options: Array.from(SIZES).map((size) => ({
          label: size,
          value: size,
          count: sizeCount.get(size) || 0,
        })),
      },
      {
        id: "grindOptions",
        title: "Grind Type",
        options: Array.from(GRIND_OPTIONS).map((grind) => ({
          label: grind,
          value: grind,
          count: grindCount.get(grind) || 0,
        })),
      },
      {
        id: "specialTags",
        title: "Special Offers",
        options: Array.from(SPECIAL_TAGS).map((tag) => ({
          label: tag,
          value: tag,
          count: tagCount.get(tag) || 0,
        })),
      },
    ];
  }, [filterState]);

  const handleFilterToggle = useCallback(
    (groupId: string, value: string) => {
      setFilterState((prev) => {
        const key = groupId as keyof Omit<
          FilterState,
          "searchQuery" | "inStockOnly"
        >;
        const newSet = new Set(prev[key] as Set<string>);

        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }

        return { ...prev, [key]: newSet };
      });
    },
    []
  );

  const handleRemoveFilter = (filterId: string) => {
    const [type, ...valueParts] = filterId.split("-");
    const value = valueParts.join("-");

    setFilterState((prev) => {
      const key =
        type === "brand"
          ? "brands"
          : type === "roast"
            ? "roastLevels"
            : type === "process"
              ? "processes"
              : type === "origin"
                ? "origins"
                : type === "brew"
                  ? "brewMethods"
                  : type === "flavor"
                    ? "flavorNotes"
                    : type === "type"
                      ? "coffeeTypes"
                      : type === "body"
                        ? "bodyLevels"
                        : type === "acidity"
                          ? "acidityLevels"
                          : type === "sweet"
                            ? "sweetnessLevels"
                            : type === "size"
                              ? "sizes"
                              : type === "grind"
                                ? "grindOptions"
                                : type === "tag"
                                  ? "specialTags"
                                  : null;

      if (!key) return prev;

      const newSet = new Set(prev[key as keyof FilterState] as Set<string>);
      newSet.delete(value);

      return { ...prev, [key]: newSet };
    });
  };

  const handleClearAllFilters = () => {
    setFilterState(EMPTY_FILTER_STATE);
    setActiveQuickFilter(undefined);
  };

  const handleSearchChange = (query: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery: query }));
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterState.brands.size) params.set("brands", Array.from(filterState.brands).join(","));
    if (filterState.roastLevels.size) params.set("roast", Array.from(filterState.roastLevels).join(","));
    if (filterState.brewMethods.size) params.set("brew", Array.from(filterState.brewMethods).join(","));
    if (filterState.specialTags.size) params.set("tags", Array.from(filterState.specialTags).join(","));
    if (filterState.searchQuery) params.set("search", filterState.searchQuery);
    if (sortBy) params.set("sort", sortBy);

    router.replace(`/shop?${params.toString()}`);
  }, [filterState, sortBy, router]);

  const handleQuickFilter = (filterId: string) => {
    setActiveQuickFilter(activeQuickFilter === filterId ? undefined : filterId);

    if (filterId === "best-sellers") {
      setFilterState((prev) => ({
        ...prev,
        specialTags: new Set(["Best Seller"]),
      }));
    } else if (filterId === "new-arrivals") {
      setFilterState((prev) => ({
        ...prev,
        specialTags: new Set(["New Arrival"]),
      }));
    } else if (filterId === "espresso") {
      setFilterState((prev) => ({
        ...prev,
        brewMethods: new Set(["Espresso"]),
      }));
    } else if (filterId === "light-roast") {
      setFilterState((prev) => ({
        ...prev,
        roastLevels: new Set(["Light"]),
      }));
    } else if (filterId === "dark-roast") {
      setFilterState((prev) => ({
        ...prev,
        roastLevels: new Set(["Dark"]),
      }));
    } else if (filterId === "single-origin") {
      setFilterState((prev) => ({
        ...prev,
        coffeeTypes: new Set(["Single Origin"]),
      }));
    } else if (filterId === "blends") {
      setFilterState((prev) => ({
        ...prev,
        coffeeTypes: new Set(["Blend"]),
      }));
    }
  };

  const quickFilters = [
    { id: "best-sellers", label: "Best Sellers" },
    { id: "new-arrivals", label: "New Arrivals" },
    { id: "espresso", label: "Espresso" },
    { id: "light-roast", label: "Light Roast" },
    { id: "dark-roast", label: "Dark Roast" },
    { id: "single-origin", label: "Single Origin" },
    { id: "blends", label: "Blends" },
  ];

  // Brand quick filters (top chips) — show icons when available
  const brandQuickChips = COFFEE_BRANDS.map((b) => ({ id: b.id, label: b.displayName, logo: b.logo, color: b.color }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 rounded-4xl border border-[#d4a373]/20 bg-linear-to-br from-[#f9f6f0] to-[#efe2d2] p-8 shadow-sm dark:from-[#2a1810] dark:to-[#23110c] lg:p-12"
      >
        <div className="mb-6 lg:mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm uppercase tracking-[0.35em] text-[#d4a373]"
          >
            Curated Global Selection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 font-serif text-4xl font-bold text-[#1a0f0a] dark:text-[#f6e5d1] lg:text-5xl"
          >
            Discover Premium Coffees from Leading Brands
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 max-w-2xl text-lg text-[#6e4b33] dark:text-[#e8d8c0]"
          >
            Explore carefully selected coffees from Costa, Starbucks, Dunkin, and more. Filter by brand, roast,
            origin, and flavor profile to find your perfect cup.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl"
        >
          <div className="max-w-2xl">
            <div className="relative flex items-center gap-3">
              <Search size={18} className="text-[#d4a373] absolute left-4" />
              <div className="w-full pl-10">
                <Autocomplete value={filterState.searchQuery} onChange={(v) => handleSearchChange(v)} />
              </div>
              {filterState.searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="ml-3 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Filter Chips */}
      <QuickFilterChips
        filters={quickFilters}
        activeFilter={activeQuickFilter}
        onSelect={handleQuickFilter}
      />

      {/* Brand Quick Chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {brandQuickChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => {
              // toggle brand
              handleFilterToggle("brands", chip.id);
            }}
            aria-pressed={filterState.brands.has(chip.id)}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition ${
              filterState.brands.has(chip.id)
                ? "bg-[#d4a373] text-white shadow-lg"
                : "border border-[#d4a373]/30 bg-white text-[#1a0f0a] hover:border-[#d4a373]"
            }`}
            style={filterState.brands.has(chip.id) ? { backgroundColor: chip.color } : {}}
          >
            {chip.logo && <Image src={chip.logo} alt="" width={16} height={16} unoptimized className="h-4 w-4 rounded-sm object-contain" />}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Desktop */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden rounded-3xl border border-[#d4a373]/20 bg-white/70 p-6 shadow-sm dark:bg-[#23110c] lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
              <SlidersHorizontal size={18} />
              Filters
            </h2>
            {activeFilterLabels.length > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-[#d4a373] hover:text-[#1a0f0a] dark:hover:text-[#f6e5d1]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filterGroups.map((group) => (
              <AccordionFilter
                key={group.id}
                group={group}
                selectedValues={
                  group.id === "brands"
                    ? filterState.brands
                    : group.id === "roastLevels"
                      ? filterState.roastLevels
                      : group.id === "processes"
                        ? filterState.processes
                        : group.id === "origins"
                          ? filterState.origins
                          : group.id === "brewMethods"
                            ? filterState.brewMethods
                            : group.id === "flavorNotes"
                              ? filterState.flavorNotes
                              : group.id === "coffeeTypes"
                                ? filterState.coffeeTypes
                                : group.id === "bodyLevels"
                                  ? filterState.bodyLevels
                                  : group.id === "acidityLevels"
                                    ? filterState.acidityLevels
                                    : group.id === "sweetnessLevels"
                                      ? filterState.sweetnessLevels
                                      : group.id === "sizes"
                                        ? filterState.sizes
                                        : group.id === "grindOptions"
                                          ? filterState.grindOptions
                                          : group.id === "specialTags"
                                            ? filterState.specialTags
                                            : new Set()
                }
                onToggle={(value) => handleFilterToggle(group.id, value)}
              />
            ))}
          </div>
        </motion.aside>

        {/* Mobile Filter Button */}
        <div className="mb-4 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-expanded={isSidebarOpen}
            aria-controls="shop-filter-drawer"
            className="flex items-center gap-2 rounded-full border border-[#d4a373]/30 bg-white/70 px-4 py-2 text-sm font-medium text-[#1a0f0a] transition hover:border-[#d4a373] dark:bg-[#23110c] dark:text-[#f6e5d1]"
          >
            <Menu size={16} />
            Filters
          </button>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <motion.aside
                id="shop-filter-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-drawer-title"
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                exit={{ x: -100 }}
                onClick={(e) => e.stopPropagation()}
                className="h-full w-full max-w-88 overflow-y-auto rounded-r-3xl border-r border-[#d4a373]/20 bg-white/95 p-6 shadow-xl dark:bg-[#23110c]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 id="filter-drawer-title" className="font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label="Close filters drawer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  {filterGroups.map((group) => (
                    <AccordionFilter
                      key={group.id}
                      group={group}
                      selectedValues={
                        group.id === "brands"
                          ? filterState.brands
                          : group.id === "roastLevels"
                            ? filterState.roastLevels
                            : group.id === "processes"
                              ? filterState.processes
                              : group.id === "origins"
                                ? filterState.origins
                                : group.id === "brewMethods"
                                  ? filterState.brewMethods
                                  : group.id === "flavorNotes"
                                    ? filterState.flavorNotes
                                    : group.id === "coffeeTypes"
                                      ? filterState.coffeeTypes
                                      : group.id === "bodyLevels"
                                        ? filterState.bodyLevels
                                        : group.id === "acidityLevels"
                                          ? filterState.acidityLevels
                                          : group.id === "sweetnessLevels"
                                            ? filterState.sweetnessLevels
                                            : group.id === "sizes"
                                              ? filterState.sizes
                                              : group.id === "grindOptions"
                                                ? filterState.grindOptions
                                                : group.id === "specialTags"
                                                  ? filterState.specialTags
                                                  : new Set()
                      }
                      onToggle={(value) => handleFilterToggle(group.id, value)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    handleClearAllFilters();
                    setIsSidebarOpen(false);
                  }}
                  className="mt-6 w-full rounded-full bg-[#1a0f0a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e76f51]"
                >
                  Clear All Filters
                </button>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div>
          {/* Active Filters Display */}
          {activeFilterLabels.length > 0 && (
            <FilterChipsRow
              activeFilters={activeFilterLabels.map((label) => ({
                id: label.id,
                label: label.label,
                variant: label.type === "brand" ? "brand" : "default",
                brandColor: COFFEE_BRANDS.find((b) => b.id === label.label.toLowerCase())?.color,
              }))}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          )}

          {/* Results Toolbar */}
          <ResultsToolbar
            count={filteredAndSorted.length}
            sortBy={sortBy}
            onSortChange={(value) => handleSortChange(value as SortOption)}
          />

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : filteredAndSorted.length > 0 ? (
            <motion.div
              layout
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredAndSorted.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onQuickView={(product) => {
                      console.log("Quick view:", product);
                    }}
                    onWishlist={toggleWishlist}
                    isWishlisted={wishlistItemIds.has(product.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
