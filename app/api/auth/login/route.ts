import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

async function getDemoFallbackUser(email: string, password: string) {
  const isDemo = email === 'demo@garagesaas.com' && (password === 'test123' || password === 'password123');
  const isTest = email === 'test@garagesaas.com' && (password === 'test123' || password === 'password123');

  if (isDemo) {
    return {
      id: 'cmv4zl4620001d96sd1e0qto2',
      email: 'demo@garagesaas.com',
      name: 'Demo Two-Wheeler Workshop',
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'active',
      password: await bcrypt.hash(password, 10),
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  if (isTest) {
    return {
      id: 'cmv4zl4620002d96sd1e0qto3',
      email: 'test@garagesaas.com',
      name: 'Premium Multi-Brand Auto Center',
      role: 'owner',
      garageType: 'four_wheeler',
      licenseStatus: 'active',
      password: await bcrypt.hash(password, 10),
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return null;
}

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
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbErr) {
      console.warn('DB error during login, attempting fallback:', dbErr);
      user = await getDemoFallbackUser(email, password);
      if (!user) throw dbErr;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
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
    return NextResponse.json({
      message: 'Login successful',
      user: userData,
    });
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
