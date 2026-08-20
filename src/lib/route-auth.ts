import { SignJWT, jwtVerify } from 'jose';

let rawAuthSecret = process.env.AUTH_SECRET;
// Allow tests to run without an explicit secret by providing a safe default when running the test lifecycle
if (!rawAuthSecret && (process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test')) {
  console.warn('AUTH_SECRET not set — using test fallback secret for test lifecycle');
  rawAuthSecret = 'test-secret';
}
if (!rawAuthSecret) {
  throw new Error('AUTH_SECRET environment variable is required and must not be empty');
}
export const AUTH_SECRET = rawAuthSecret;

export type RouteHintPayload = {
  userId: string;
  role: 'customer' | 'admin' | 'manager';
  exp?: number;
};

const routeSecret = new TextEncoder().encode(AUTH_SECRET);

export async function signRouteHint(payload: RouteHintPayload, ttlSeconds = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(routeSecret);
}

export async function verifyRouteHint(token: string) {
  try {
    const result = await jwtVerify(token, routeSecret);
    return result.payload as RouteHintPayload;
  } catch {
    return null;
  }
}
