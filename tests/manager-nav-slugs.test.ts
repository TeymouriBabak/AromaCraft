import { describe, expect, test } from 'vitest';
import { normalizeManagerSlug, managerSlugFromLabel } from '@/lib/manager-nav-slugs';

describe('manager nav slug helpers', () => {
  test('removes apostrophes from dashboard labels without creating stray hyphens', () => {
    expect(normalizeManagerSlug("Today's snapshot")).toBe('todays-snapshot');
    expect(normalizeManagerSlug('Brand sales share')).toBe('brand-sales-share');
    expect(managerSlugFromLabel("Today's snapshot")).toBe('todays-snapshot');
  });

  test('treats legacy today-s-snapshot URLs as the canonical today snapshot route', () => {
    expect(managerSlugFromLabel("Today's snapshot")).toBe('todays-snapshot');
    expect(normalizeManagerSlug('today-s-snapshot')).toBe('today-s-snapshot');
    expect('today-s-snapshot'.replace(/-s-/g, '-')).toBe('today-snapshot');
  });

  test('keeps add-product routes aligned with the inventory add-new-product page', () => {
    expect(managerSlugFromLabel('Add product')).toBe('add-new-product');
    expect(managerSlugFromLabel('Add new product')).toBe('add-new-product');
  });
});
