export function normalizeManagerSlug(value: string) {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function canonicalManagerSlug(value: string) {
  const normalized = normalizeManagerSlug(value);
  const aliases: Record<string, string> = {
    'today-s-snapshot': 'todays-snapshot',
    'today-snapshot': 'todays-snapshot',
    'todays-snapshot': 'todays-snapshot',
    'add-product': 'add-new-product',
    'add-new-product': 'add-new-product',
    'low-stock': 'low-stock-alerts',
    'low-stock-alerts': 'low-stock-alerts',
    'edit-shop-filters': 'edit-shop-filters',
    'manage-brands': 'manage-brands',
    'product-list': 'product-list',
  };
  return aliases[normalized] ?? normalized;
}

export function managerSlugFromLabel(value: string) {
  return canonicalManagerSlug(value);
}

export function managerRouteFromSection(section: string, child?: string) {
  const normalizedSection = managerSlugFromLabel(section);
  const normalizedChild = child ? managerSlugFromLabel(child) : '';

  if (!child) {
    if (normalizedSection === 'overview') return '/dashboard/manager';
    return `/dashboard/manager/${normalizedSection}`;
  }

  if (['orders', 'inventory', 'customers', 'reports-analytics', 'admin-management', 'reviews-moderation', 'shop-management', 'content-management', 'register-customer'].includes(normalizedSection)) {
    return `/dashboard/manager/${normalizedSection}/${normalizedChild}`;
  }

  return `/dashboard/manager/${normalizedChild}`;
}
