/**
 * Test Fixtures & Mock Data
 *
 * Central repository for ALL mock users, mock data, and test fixtures.
 * These are ONLY active when USE_MOCKS=true or NODE_ENV=development.
 *
 * Production: Database is the single source of truth.
 * Development: Use fixtures for seeding and testing.
 *
 * OCL Rule: Mock/Fixture Isolation
 */

export type MockUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // FOR DEV ONLY - Never expose in production
  role: 'customer' | 'admin' | 'manager';
  name?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  countryCode?: string;
  emailVerified?: Date | string | null;
};

/**
 * Mock users for development/seeding ONLY
 *
 * WARNING: These are PLAINTEXT passwords for demo purposes only.
 * In production, all passwords are hashed via bcryptjs.
 */
const devPassword = process.env.DEV_MOCK_PASSWORD;

export const MOCK_USERS: MockUser[] = devPassword
  ? [
      {
        id: 'u_customer',
        username: 'Tbabak',
        email: 'tbabak@example.com',
        passwordHash: devPassword,
        role: 'customer',
        name: 'Babak Teymouri',
        firstName: 'Babak',
        lastName: 'Teymouri',
        mobile: '+1234567890',
        countryCode: '+1',
      },
      {
        id: 'u_admin',
        username: 'Admin_Aroma',
        email: 'manager@aromacraft.test',
        passwordHash: devPassword,
        role: 'admin',
        name: 'Aroma Sales Manager',
        firstName: 'Aroma',
        lastName: 'Manager',
        mobile: '+1111111111',
        countryCode: '+1',
      },
      {
        id: 'u_manager',
        username: 'Manager_Aroma',
        email: 'manager@aromacraft.test',
        passwordHash: devPassword,
        role: 'manager',
        name: 'System Manager',
        firstName: 'System',
        lastName: 'Manager',
        mobile: '+1222222222',
        countryCode: '+1',
      },
      {
        id: 'u_manager_legacy',
        username: 'Manager_Aroma_legacy',
        email: 'super@aromacraft.test',
        passwordHash: devPassword,
        role: 'manager',
        name: 'System Manager (legacy)',
        firstName: 'System',
        lastName: 'Manager',
        mobile: '+1222222222',
        countryCode: '+1',
      },
    ]
  : [];

/**
 * Mock reviews for development/home page seeding
 */
export const MOCK_REVIEWS = [
  {
    id: 'review_1',
    destination: 'home',
    title: 'Home',
    rating: 5,
    content:
      'A calm, confident experience from discovery to delivery. Everything feels premium and effortless.',
    author: 'Amelia',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'review_2',
    destination: 'pike-place',
    title: 'Pike Place',
    rating: 5,
    content:
      'A luxurious daily ritual with the smoothness and consistency I want in a neighborhood coffee favorite.',
    author: 'Noah',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Find mock user by email/username/id
 * @param identifier - Email, username, or user ID
 */
export function findMockUser(identifier: string): MockUser | undefined {
  const normalized = identifier.trim().toLowerCase();
  return MOCK_USERS.find(
    (u) =>
      u.email.toLowerCase() === normalized ||
      u.username.toLowerCase() === normalized ||
      u.id === identifier
  );
}

/**
 * Find mock user by email only
 */
export function findMockUserByEmail(email: string): MockUser | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_USERS.find((u) => u.email.toLowerCase() === normalized);
}

/**
 * Find mock user by username only
 */
export function findMockUserByUsername(username: string): MockUser | undefined {
  const normalized = username.trim().toLowerCase();
  return MOCK_USERS.find((u) => u.username.toLowerCase() === normalized);
}

/**
 * Find mock user by ID
 */
export function findMockUserById(userId: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === userId);
}

/**
 * List all mock users (DEV ONLY)
 */
export function listMockUsers(): MockUser[] {
  return MOCK_USERS.map((u) => ({
    ...u,
    passwordHash: '[REDACTED]', // Never expose plaintext hashes
  }));
}
