import type { Product } from '@/lib/shop-products';

export type SortOption =
  | 'best-selling'
  | 'newest'
  | 'top-rated'
  | 'price-low'
  | 'price-high'
  | 'alphabetical'
  | 'roast'
  | 'brand'
  | 'most-reviewed';

export interface FilterState {
  brands: Set<string>;
  roastLevels: Set<string>;
  processes: Set<string>;
  origins: Set<string>;
  brewMethods: Set<string>;
  flavorNotes: Set<string>;
  coffeeTypes: Set<string>;
  bodyLevels: Set<string>;
  acidityLevels: Set<string>;
  sweetnessLevels: Set<string>;
  sizes: Set<string>;
  grindOptions: Set<string>;
  specialTags: Set<string>;
  searchQuery: string;
  inStockOnly: boolean;
}

export const EMPTY_FILTER_STATE: FilterState = {
  brands: new Set(),
  roastLevels: new Set(),
  processes: new Set(),
  origins: new Set(),
  brewMethods: new Set(),
  flavorNotes: new Set(),
  coffeeTypes: new Set(),
  bodyLevels: new Set(),
  acidityLevels: new Set(),
  sweetnessLevels: new Set(),
  sizes: new Set(),
  grindOptions: new Set(),
  specialTags: new Set(),
  searchQuery: '',
  inStockOnly: false,
};

export function filterProducts(
  products: Product[],
  filters: FilterState
): Product[] {
  return products.filter((product) => {
    // Brand filter
    if (filters.brands.size > 0 && !filters.brands.has(product.brand)) {
      return false;
    }

    // Roast level filter
    if (
      filters.roastLevels.size > 0 &&
      !filters.roastLevels.has(product.roast)
    ) {
      return false;
    }

    // Process filter
    if (filters.processes.size > 0 && !filters.processes.has(product.process)) {
      return false;
    }

    // Origin filter
    if (
      filters.origins.size > 0 &&
      !filters.origins.has(product.originRegion)
    ) {
      return false;
    }

    // Brew method filter (product must have at least one selected method)
    if (filters.brewMethods.size > 0) {
      const hasBrewMethod = product.brewMethods.some((method) =>
        filters.brewMethods.has(method)
      );
      if (!hasBrewMethod) return false;
    }

    // Flavor notes filter (product must have at least one selected note)
    if (filters.flavorNotes.size > 0) {
      const hasFlavor = product.tastingNotes.some((note) =>
        filters.flavorNotes.has(note)
      );
      if (!hasFlavor) return false;
    }

    // Coffee type filter
    if (
      filters.coffeeTypes.size > 0 &&
      !filters.coffeeTypes.has(product.coffeeType)
    ) {
      return false;
    }

    // Body level filter
    if (filters.bodyLevels.size > 0 && !filters.bodyLevels.has(product.body)) {
      return false;
    }

    // Acidity filter
    if (
      filters.acidityLevels.size > 0 &&
      !filters.acidityLevels.has(product.acidity)
    ) {
      return false;
    }

    // Sweetness filter
    if (
      filters.sweetnessLevels.size > 0 &&
      !filters.sweetnessLevels.has(product.sweetness)
    ) {
      return false;
    }

    // Size filter (product must have exact size or be flexible)
    if (filters.sizes.size > 0 && !filters.sizes.has(product.size)) {
      return false;
    }

    // Grind option filter (product must have at least one selected grind)
    if (filters.grindOptions.size > 0) {
      const hasGrind = product.grindTypes.some((grind) =>
        filters.grindOptions.has(grind)
      );
      if (!hasGrind) return false;
    }

    // Special tags filter (product must have at least one selected tag)
    if (filters.specialTags.size > 0) {
      const hasTag = product.specialTags.some((tag) =>
        filters.specialTags.has(tag)
      );
      if (!hasTag) return false;
    }

    // Stock filter
    if (filters.inStockOnly && !product.inStock) {
      return false;
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        product.name,
        product.brand,
        product.country,
        product.origin,
        product.description,
        ...product.tastingNotes,
        ...product.brewMethods,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function sortProducts(
  products: Product[],
  sortBy: SortOption
): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'best-selling':
      return sorted.sort((a, b) => b.reviews - a.reviews);

    case 'newest':
      return sorted.sort((a, b) => {
        const aIsNew = a.specialTags.includes('New Arrival') ? 1 : 0;
        const bIsNew = b.specialTags.includes('New Arrival') ? 1 : 0;
        return bIsNew - aIsNew;
      });

    case 'top-rated':
      return sorted.sort((a, b) => b.rating - a.rating);

    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);

    case 'alphabetical':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'roast':
      const roastOrder = { Light: 0, Medium: 1, Dark: 2 };
      return sorted.sort(
        (a, b) => (roastOrder[a.roast] ?? 0) - (roastOrder[b.roast] ?? 0)
      );

    case 'brand':
      return sorted.sort((a, b) => a.brand.localeCompare(b.brand));

    case 'most-reviewed':
      return sorted.sort((a, b) => b.reviews - a.reviews);

    default:
      return sorted;
  }
}

export function countFilterOptions(
  products: Product[],
  filterKey: keyof Omit<FilterState, 'searchQuery' | 'inStockOnly'>,
  currentFilters: FilterState
): Map<string, number> {
  const counts = new Map<string, number>();

  // Get all possible values for this filter type
  const allValues = new Set<string>();

  products.forEach((product) => {
    switch (filterKey) {
      case 'brands':
        allValues.add(product.brand);
        break;
      case 'roastLevels':
        allValues.add(product.roast);
        break;
      case 'processes':
        allValues.add(product.process);
        break;
      case 'origins':
        allValues.add(product.originRegion);
        break;
      case 'brewMethods':
        product.brewMethods.forEach((m) => allValues.add(m));
        break;
      case 'flavorNotes':
        product.tastingNotes.forEach((n) => allValues.add(n));
        break;
      case 'coffeeTypes':
        allValues.add(product.coffeeType);
        break;
      case 'bodyLevels':
        allValues.add(product.body);
        break;
      case 'acidityLevels':
        allValues.add(product.acidity);
        break;
      case 'sweetnessLevels':
        allValues.add(product.sweetness);
        break;
      case 'sizes':
        allValues.add(product.size);
        break;
      case 'grindOptions':
        product.grindTypes.forEach((g) => allValues.add(g));
        break;
      case 'specialTags':
        product.specialTags.forEach((t) => allValues.add(t));
        break;
    }
  });

  // Count products for each value
  allValues.forEach((value) => {
    let count = 0;

    products.forEach((product) => {
      // Create a copy of filters with this value added
      // For set-based filters, we need to check if product matches
      let matches = false;

      switch (filterKey) {
        case 'brands':
          matches = product.brand === value;
          break;
        case 'roastLevels':
          matches = product.roast === value;
          break;
        case 'processes':
          matches = product.process === value;
          break;
        case 'origins':
          matches = product.originRegion === value;
          break;
        case 'brewMethods':
          matches = product.brewMethods.includes(
            value as (typeof product.brewMethods)[number]
          );
          break;
        case 'flavorNotes':
          matches = product.tastingNotes.includes(
            value as (typeof product.tastingNotes)[number]
          );
          break;
        case 'coffeeTypes':
          matches = product.coffeeType === value;
          break;
        case 'bodyLevels':
          matches = product.body === value;
          break;
        case 'acidityLevels':
          matches = product.acidity === value;
          break;
        case 'sweetnessLevels':
          matches = product.sweetness === value;
          break;
        case 'sizes':
          matches = product.size === value;
          break;
        case 'grindOptions':
          matches = product.grindTypes.includes(
            value as (typeof product.grindTypes)[number]
          );
          break;
        case 'specialTags':
          matches = product.specialTags.includes(
            value as (typeof product.specialTags)[number]
          );
          break;
      }

      // Check if product matches other active filters
      if (matches) {
        // Create a test filter state excluding current filter type
        const testFiltersExcludingCurrent = { ...currentFilters };
        (testFiltersExcludingCurrent[filterKey] as Set<string>) = new Set();

        if (filterProducts([product], testFiltersExcludingCurrent).length > 0) {
          count++;
        }
      }
    });

    counts.set(value, count);
  });

  return counts;
}

export function getActiveFilterLabels(filters: FilterState): Array<{
  id: string;
  label: string;
  type: string;
}> {
  const labels: Array<{ id: string; label: string; type: string }> = [];

  filters.brands.forEach((brand) => {
    labels.push({ id: `brand-${brand}`, label: brand, type: 'brand' });
  });

  filters.roastLevels.forEach((level) => {
    labels.push({ id: `roast-${level}`, label: level, type: 'roast' });
  });

  filters.processes.forEach((process) => {
    labels.push({ id: `process-${process}`, label: process, type: 'process' });
  });

  filters.origins.forEach((origin) => {
    labels.push({ id: `origin-${origin}`, label: origin, type: 'origin' });
  });

  filters.brewMethods.forEach((method) => {
    labels.push({ id: `brew-${method}`, label: method, type: 'brew' });
  });

  filters.flavorNotes.forEach((note) => {
    labels.push({ id: `flavor-${note}`, label: note, type: 'flavor' });
  });

  filters.coffeeTypes.forEach((type) => {
    labels.push({ id: `type-${type}`, label: type, type: 'type' });
  });

  filters.bodyLevels.forEach((body) => {
    labels.push({ id: `body-${body}`, label: body, type: 'body' });
  });

  filters.acidityLevels.forEach((acidity) => {
    labels.push({ id: `acidity-${acidity}`, label: acidity, type: 'acidity' });
  });

  filters.sweetnessLevels.forEach((sweetness) => {
    labels.push({ id: `sweet-${sweetness}`, label: sweetness, type: 'sweet' });
  });

  filters.sizes.forEach((size) => {
    labels.push({ id: `size-${size}`, label: size, type: 'size' });
  });

  filters.grindOptions.forEach((grind) => {
    labels.push({ id: `grind-${grind}`, label: grind, type: 'grind' });
  });

  filters.specialTags.forEach((tag) => {
    labels.push({ id: `tag-${tag}`, label: tag, type: 'tag' });
  });

  return labels;
}

// Provide lightweight search suggestion scoring for autocomplete
export function searchSuggestions(
  products: Product[],
  query: string,
  maxResults = 6
) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  const scored = products.map((p) => {
    let score = 0;
    const name = p.name.toLowerCase();
    const brand = p.brand.toLowerCase();
    const country = p.country.toLowerCase();
    const origin = p.origin.toLowerCase();

    if (name.includes(q)) score += 5;
    if (brand.includes(q)) score += 3;
    if (country.includes(q) || origin.includes(q)) score += 2;
    if (p.tastingNotes.join(' ').toLowerCase().includes(q)) score += 1.5;
    if (p.brewMethods.join(' ').toLowerCase().includes(q)) score += 1;

    // short-circuit exact startsWith promotions
    if (name.startsWith(q)) score += 2;

    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews)
    .slice(0, maxResults)
    .map((s) => s.product);
}
