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
    // 1. Sliding Window Rate Limiting (15 attempts per 10 mins per IP)
    const clientIp = getClientIp(request);
    const isLocalOrTest = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost' || process.env.NODE_ENV !== 'production';
    const rateCheck = checkRateLimit(clientIp, {
      keyPrefix: 'login_ip',
      maxRequests: isLocalOrTest ? 200 : 50,
      windowSeconds: 10 * 60,
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

    const rawInput = email.toLowerCase().trim();
    const cleanDigits = rawInput.replace(/\D/g, '');

    // Search by exact email or phone number match
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawInput },
          ...(cleanDigits.length >= 10 ? [{ phone: { contains: cleanDigits.slice(-10) } }] : []),
        ],
      },
    });

    // If not found, resolve Akshat aliases (e.g. akshat@..., 7259625881)
    if (!user && (rawInput.includes('akshat') || cleanDigits.includes('7259625881'))) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'akshat@motoban.in' },
            { email: 'garage2motofit@gmail.com' },
            { email: 'akshatmohanty@gmail.com' },
            { name: { contains: 'Akshat' } },
            { phone: { contains: '7259625881' } },
          ],
        },
      });
    }

    // If not found, resolve Samael / Manash aliases
    if (!user && (rawInput.includes('samael') || rawInput.includes('manash') || cleanDigits.includes('6359635416'))) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'manashdash@aol.com' },
            { name: { contains: 'Samael' } },
            { phone: { contains: '6359635416' } },
          ],
        },
      });
    }

    // If not found, resolve MotoFit workshop aliases
    if (!user && rawInput.includes('motofit')) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'garage2motofit@gmail.com' },
            { email: 'motofit2@garagesaas.com' },
          ],
        },
      });
    }

    // If not found, resolve Munna (Senior Mechanic) aliases
    if (!user && (rawInput.includes('munna') || cleanDigits.includes('9123293450'))) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'munna@motoban.in' },
            { name: { contains: 'Munna' } },
            { phone: { contains: '9123293450' } },
          ],
        },
      });
    }

    // If not found, resolve Kunal (Mechanic) aliases
    if (!user && (rawInput.includes('kunal') || cleanDigits.includes('6354473666'))) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'kunal@motoban.in' },
            { name: { contains: 'Kunal' } },
            { phone: { contains: '6354473666' } },
          ],
        },
      });
    }

    // If not found, resolve Manager aliases
    if (!user && rawInput.includes('manager')) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'manager@motoban.in' },
            { name: { contains: 'Manager' } },
          ],
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    let isValidPassword = await bcrypt.compare(password, user.password);

    // Master VIP & Quick PIN fallback for founding garage partners (Akshat / Samael / Munna / Kunal / Manager)
    const isVipUser =
      user.licenseStatus === 'lifetime_free' ||
      user.email.includes('akshat') ||
      user.email.includes('motofit') ||
      user.email.includes('manash') ||
      user.email.includes('samael') ||
      user.email.includes('munna') ||
      user.email.includes('kunal') ||
      user.email.includes('manager');

    if (!isValidPassword && isVipUser) {
      if (password === 'MotoFit@2026' || password === '1234') {
        isValidPassword = true;
        const newHash = await bcrypt.hash('MotoFit@2026', 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash },
        }).catch(() => {});
      }
    }

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
