import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateLicenseKey } from '@/lib/utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate limit registration to 5 attempts per IP per hour
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, {
      keyPrefix: 'register_ip',
      maxRequests: 5,
      windowSeconds: 60 * 60,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many registration attempts from your IP. Please try again in ${rateCheck.resetInSeconds}s.`,
          code: 'RATE_LIMITED',
        },
        { status: 429, headers: { 'Retry-After': rateCheck.resetInSeconds.toString() } }
      );
    }

    const body = await request.json();
    const { email, password, name, phone, garageType } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate garage type
    if (garageType && !['two_wheeler', 'four_wheeler'].includes(garageType)) {
      return NextResponse.json(
        { error: 'Invalid garage type' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Check if this account is one of the 2 VIP Free Founding Garages
    const { isVipFreeGarage } = await import('@/lib/licensing');
    const isVip = isVipFreeGarage(email);

    // Create user with 15-day trial license or lifetime_free for VIP garages
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        garageType: garageType || 'four_wheeler',
        licenseKey,
        licenseStatus: isVip ? 'lifetime_free' : 'trial',
        expiresAt: isVip ? null : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days SaaS trial blueprint
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        garageType: true,
        licenseKey: true,
        licenseStatus: true,
        expiresAt: true,
      },
    });

    const { signSessionToken, SESSION_COOKIE_NAME } = await import('@/lib/auth');
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'owner',
      garageType: user.garageType,
      licenseStatus: user.licenseStatus,
    });

    const response = NextResponse.json({
      message: 'User registered successfully',
      token,
      user,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
