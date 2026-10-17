import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  garageType?: string;
  licenseStatus?: string;
}

export const SESSION_COOKIE_NAME = 'motoban_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ||
  process.env.SESSION_SECRET ||
  'motoban-production-secure-secret-key-32chars-minimum'
);

/**
 * Sign a secure JWT session token for Web and Mobile
 */
export async function signSessionToken(payload: SessionUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.userId || !payload.email) {
      return null;
    }
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      role: (payload.role as string) || 'owner',
      garageType: payload.garageType as string | undefined,
      licenseStatus: payload.licenseStatus as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from Request:
 * 1. Checks `Authorization: Bearer <token>` header (Native Mobile App / API calls)
 * 2. Checks `motoban_session` cookie (Next.js Web App)
 */
export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  // 1. Check Authorization header
  if (request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const user = await verifySessionToken(token);
      if (user) return user;
    }

    // 2. Check Cookie header from incoming request
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
      if (match) {
        const token = match.split('=')[1];
        if (token) {
          const user = await verifySessionToken(token);
          if (user) return user;
        }
      }
    }
  }

  // 3. Fallback to Next.js cookies API
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      return await verifySessionToken(token);
    }
  } catch {
    // In Edge contexts or where cookies() isn't accessible, gracefully continue
  }

  return null;
}

/**
 * Require authenticated user on API route.
 * Returns { user, errorResponse: null } if valid, or { user: null, errorResponse: NextResponse } if unauthorized.
 */
export async function requireAuth(request: Request): Promise<
  | { user: SessionUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const user = await getSessionUser(request);
  if (!user || !user.userId) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error: 'Authentication required. Please sign in to access this resource.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  return { user, errorResponse: null };
}
