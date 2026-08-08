import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'aromacraft_sid';
const protectedRoutePrefixes = ['/dashboard', '/account'];
const publicRoutePaths = ['/', '/about', '/auth', '/checkout', '/contact', '/login', '/quiz', '/shop'];
const publicRoutePrefixes = ['/about', '/checkout', '/quiz', '/shop', '/contact'];
const publicAssetPrefixes = ['/_next', '/api', '/images', '/fonts', '/icons', '/favicon', '/robots.txt', '/sitemap.xml'];

function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicRoute(pathname: string) {
  return publicRoutePaths.includes(pathname) || publicRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicAssetRoute(pathname: string) {
  return publicAssetPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicAssetRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!hasSessionCookie) {
    const redirectUrl = new URL('/login', req.url);
    const callbackValue = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    redirectUrl.searchParams.set('callbackUrl', callbackValue);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/api/dashboard/:path*', '/checkout', '/wishlist', '/login', '/auth'],
};
