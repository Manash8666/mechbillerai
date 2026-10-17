import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'dashboard',
  'mail',
  'static',
  'assets',
  'localhost',
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0].toLowerCase();

  // Extract client subdomain (e.g. "motofit.motoban.in" -> "motofit", "motofit.localhost" -> "motofit")
  let subdomain: string | null = null;
  if (host.endsWith('.motoban.in')) {
    subdomain = host.slice(0, -'.motoban.in'.length);
  } else if (host.includes('.localhost')) {
    subdomain = host.split('.')[0];
  }

  const isTenantSubdomain = Boolean(subdomain && !RESERVED_SUBDOMAINS.has(subdomain));

  // If a client visits the root of their custom subdomain (e.g. https://motofit.motoban.in/)
  if (isTenantSubdomain && (pathname === '/' || pathname === '')) {
    const portalUrl = new URL(`/portal/${subdomain}`, request.url);
    const response = NextResponse.rewrite(portalUrl);
    response.headers.set('x-tenant-subdomain', subdomain as string);
    return response;
  }

  // Protect /dashboard and all its subroutes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySessionToken(token);
    if (!session) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  // If user is already logged in with valid session, redirect away from /login and /register to /dashboard
  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  const response = NextResponse.next();
  if (isTenantSubdomain && subdomain) {
    response.headers.set('x-tenant-subdomain', subdomain);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|manifest.json).*)'],
};

