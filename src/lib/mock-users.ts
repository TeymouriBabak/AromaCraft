/**
 * DEPRECATED: Backward compatibility wrapper
 * Use src/lib/fixtures/mock-users.ts instead
 */
import { listMockUsers } from './fixtures/mock-users';

export type DevUser = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export function devListUsers(): DevUser[] {
  return listMockUsers().map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
  }));
}
