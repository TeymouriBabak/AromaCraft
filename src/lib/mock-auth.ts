import crypto from 'crypto';

export type Role = 'customer' | 'manager' | 'admin';

export type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // for demo only
  role: Role;
  name?: string;
  firstName?: string;
  lastName?: string;
};

const users: User[] = [
  {
    id: 'u_customer',
    username: 'Tbabak',
    email: 'tbabak@example.com',
    passwordHash: 'Teymouribabak78#',
    role: 'customer',
    name: 'Babak Teymouri',
    firstName: 'Babak',
    lastName: 'Teymouri',
  },
  {
    id: 'u_manager',
    username: 'Admin_Aroma',
    email: 'manager@aromacraft.test',
    passwordHash: 'AromaAdmin2026#',
    role: 'manager',
    name: 'Aroma Sales Manager',
    firstName: 'Aroma',
    lastName: 'Manager',
  },
  {
    id: 'u_admin',
    username: 'Super_Aroma',
    email: 'super@aromacraft.test',
    passwordHash: 'SuperAroma2026#',
    role: 'admin',
    name: 'System Super Admin',
    firstName: 'System',
    lastName: 'Admin',
  },
];

export function findUserByEmail(emailOrId: string) {
  const normalized = emailOrId.trim().toLowerCase();
  return users.find(
    (u) => u.email.toLowerCase() === normalized || u.id === emailOrId || u.username.toLowerCase() === normalized
  );
}

export function findUserByUsername(username: string) {
  const normalized = username.trim().toLowerCase();
  return users.find(
    (u) => u.username.toLowerCase() === normalized || u.id === username || u.email.toLowerCase() === normalized
  );
}

export function findUserById(userId: string) {
  return users.find((u) => u.id === userId);
}

export function createUser(userData: Omit<User, 'id'>) {
  const id = `u_${Date.now()}`;
  const nextUser = { id, ...userData };
  users.push(nextUser);
  return nextUser;
}

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
