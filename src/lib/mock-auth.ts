/**
 * Mock Authentication Utilities (Development Only)
 * 
 * This module provides mock auth functions for LOCAL development/testing.
 * In production, all authentication routes through db-auth.ts using real database.
 * 
 * OCL: Mock/Fixture Isolation - All mock data centralized in src/lib/fixtures/
 * 
 * DEPRECATED: Use src/lib/fixtures/mock-users.ts for fixture data
 * Keep this file for backward compatibility with existing code.
 */
import crypto from 'crypto';
import {
  MOCK_USERS,
  findMockUserByEmail as findFixtureMockUserByEmail,
  findMockUserByUsername as findFixtureMockUserByUsername,
  findMockUserById as findFixtureMockUserById,
  type MockUser,
} from './fixtures/mock-users';

export type Role = 'customer' | 'manager' | 'admin' | 'super_admin';

export type User = MockUser;

// Re-export for backward compatibility
export const users: User[] = MOCK_USERS;

export function findUserByEmail(emailOrId: string) {
  return findFixtureMockUserByEmail(emailOrId) || findFixtureMockUserByUsername(emailOrId);
}

export function findUserByUsername(username: string) {
  return findFixtureMockUserByUsername(username) || findFixtureMockUserByEmail(username);
}

export function findUserById(userId: string) {
  return findFixtureMockUserById(userId);
}

export function createUser(userData: Omit<User, 'id'>) {
  const id = `u_${Date.now()}`;
  const nextUser = { id, ...userData };
  users.push(nextUser);
  return nextUser;
}

// Token store for password reset (IN-MEMORY, development only)
const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

export function generateResetToken(userId: string, ttlSeconds = 60 * 15) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + ttlSeconds * 1000;
  tokenStore.set(token, { userId, expiresAt });
  return { token, expiresAt };
}

export function verifyResetToken(token: string) {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return null;
  }
  return entry;
}

export function clearResetToken(token: string) {
  tokenStore.delete(token);
}

export function devListUsers() {
  return users.map((u) => ({ id: u.id, username: u.username, email: u.email, role: u.role }));
}
