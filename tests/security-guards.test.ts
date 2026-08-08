import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessOrder, calculateOrderTotals, isSessionValid } from '../src/lib/security-guards';

test('customers can only access their own orders', () => {
  assert.equal(canAccessOrder({ userId: 'u1', role: 'customer', isActive: true }, 'u1', 'o1'), true);
  assert.equal(canAccessOrder({ userId: 'u1', role: 'customer', isActive: true }, 'u2', 'o1'), false);
});

test('admins can access other users orders', () => {
  assert.equal(canAccessOrder({ userId: 'u1', role: 'admin', isActive: true }, 'u2', 'o1'), true);
});

test('inactive or expired sessions are rejected', () => {
  assert.equal(isSessionValid({ status: 'ACTIVE', expiresAt: new Date(Date.now() + 60_000) }, { isActive: true }), true);
  assert.equal(isSessionValid({ status: 'REVOKED', expiresAt: new Date(Date.now() + 60_000) }, { isActive: true }), false);
  assert.equal(isSessionValid({ status: 'ACTIVE', expiresAt: new Date(Date.now() - 60_000) }, { isActive: true }), false);
  assert.equal(isSessionValid({ status: 'ACTIVE', expiresAt: new Date(Date.now() + 60_000) }, { isActive: false }), false);
});

test('order totals are computed from server-side product prices', () => {
  const items = [
    { productId: 'p1', quantity: 2 },
    { productId: 'p2', quantity: 1 },
  ];
  const products = [
    { id: 'p1', price: 1200 },
    { id: 'p2', price: 800 },
  ];

  const result = calculateOrderTotals(items, products);
  assert.equal(result.subtotal, 3200);
  assert.equal(result.shippingFee, 500);
  assert.equal(result.total, 3700);
});

test('unknown products are rejected during order calculation', () => {
  const items = [{ productId: 'missing', quantity: 1 }];
  const products = [{ id: 'p1', price: 1200 }];

  assert.throws(() => calculateOrderTotals(items, products), /Unknown product/);
});
