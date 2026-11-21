import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

function checkLicenseStatus(user: any): string | null {
  if (user.licenseStatus === 'expired') {
    return 'License expired. Please renew your license.';
  }
  if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
    return 'License expired. Please renew your license.';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // 1. Sliding Window Rate Limiting (5 failed attempts per 15 mins per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, {
      keyPrefix: 'login_ip',
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many login attempts. For security, your IP is temporarily throttled. Please retry in ${rateCheck.resetInSeconds}s.`,
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateCheck.resetInSeconds.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const licenseError = checkLicenseStatus(user);
    if (licenseError) {
      return NextResponse.json(
        { error: licenseError },
        { status: 403 }
      );
    }

    const { password: _, ...userData } = user;
    const { signSessionToken, SESSION_COOKIE_NAME } = await import('@/lib/auth');
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      garageType: user.garageType,
      licenseStatus: user.licenseStatus,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: userData,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error',
        code: error?.code || 'AUTH_FAILURE',
      },
      { status: 500 }
    );
  }
}
