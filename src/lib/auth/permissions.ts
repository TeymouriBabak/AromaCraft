export type Role = 'manager' | 'admin' | 'customer';

export type Permission =
  | 'dashboard:view'
  | 'dashboard:overview'
  | 'product:read'
  | 'product:write'
  | 'product:delete'
  | 'brand:read'
  | 'brand:write'
  | 'inventory:read'
  | 'inventory:alerts'
  | 'filter:write'
  | 'order:read'
  | 'order:write'
  | 'order:cancel'
  | 'refund:read'
  | 'refund:write'
  | 'refund:request'
  | 'review:read'
  | 'review:moderate'
  | 'review:write'
  | 'review:delete'
  | 'customer:read'
  | 'customer:write'
  | 'customer:ban'
  | 'admin:read'
  | 'admin:write'
  | 'content:read'
  | 'content:write'
  | 'content:publish'
  | 'report:read'
  | 'report:export'
  | 'activity:read'
  | 'user:read'
  | 'profile:read'
  | 'profile:write'
  | 'address:read'
  | 'address:write'
  | 'wishlist:read'
  | 'wishlist:write';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  manager: [
    'dashboard:view',
    'dashboard:overview',
    'product:read',
    'product:write',
    'product:delete',
    'brand:read',
    'brand:write',
    'inventory:read',
    'inventory:alerts',
    'filter:write',
    'order:read',
    'order:write',
    'order:cancel',
    'refund:read',
    'refund:write',
    'refund:request',
    'review:read',
    'review:moderate',
    'review:write',
    'review:delete',
    'customer:read',
    'customer:write',
    'customer:ban',
    'admin:read',
    'admin:write',
    'content:read',
    'content:write',
    'content:publish',
    'report:read',
    'report:export',
    'activity:read',
    'user:read',
    'profile:read',
    'profile:write',
    'address:read',
    'address:write',
    'wishlist:read',
    'wishlist:write',
  ],
  admin: [
    'dashboard:view',
    'dashboard:overview',
    'product:read',
    'product:write',
    'inventory:read',
    'inventory:alerts',
    'order:read',
    'order:write',
    'refund:read',
    'refund:request',
    'review:read',
    'review:moderate',
    'review:write',
    'review:delete',
    'customer:read',
    'customer:write',
    'admin:read',
    'content:read',
    'content:write',
    'report:read',
    'activity:read',
    'user:read',
    'profile:read',
    'profile:write',
    'address:read',
    'address:write',
    'wishlist:read',
    'wishlist:write',
  ],
  customer: [
    'dashboard:view',
    'dashboard:overview',
    'product:read',
    'order:read',
    'order:cancel',
    'refund:read',
    'refund:request',
    'review:read',
    'review:write',
    'review:delete',
    'profile:read',
    'profile:write',
    'address:read',
    'address:write',
    'wishlist:read',
    'wishlist:write',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role, permissions: Permission[]) {
  return permissions.some((permission) => can(role, permission));
}

export const DASHBOARD_ACCESS: Record<
  'admin' | 'customer' | 'manager',
  Permission[]
> = {
  manager: ['dashboard:view', 'dashboard:overview'],
  admin: ['dashboard:view', 'dashboard:overview'],
  customer: ['dashboard:view', 'dashboard:overview'],
};

export function hasDashboardAccess(role: Role, section: 'overview' = 'overview') {
  const required = section === 'overview' ? 'dashboard:overview' : 'dashboard:view';
  return can(role, required) || can(role, 'dashboard:view');
}

export function assertDashboardPermission(role: Role, section: 'overview' = 'overview') {
  return hasDashboardAccess(role, section);
}
