import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'aromacraft_sid';
const protectedPagePrefixes = ['/dashboard', '/account'];
const protectedApiPrefixes = ['/api/dashboard'];

function startsWithPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/dev')) {
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse('Not Found', { status: 404 });
    }
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (startsWithPrefix(pathname, protectedApiPrefixes)) {
    if (!hasSessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (startsWithPrefix(pathname, protectedPagePrefixes) && !hasSessionCookie) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set(
      'callbackUrl',
      `${pathname}${req.nextUrl.search}`
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/api/dashboard/:path*',
    '/api/dev/:path*',
  ],
};
