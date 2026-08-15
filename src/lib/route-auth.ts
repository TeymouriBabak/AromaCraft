import { SignJWT, jwtVerify } from 'jose';

export const AUTH_SECRET = process.env.AUTH_SECRET || 'development-auth-secret-change-me';

export type RouteHintPayload = {
  userId: string;
  role: 'customer' | 'manager' | 'admin' | 'super_admin';
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
