import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user with fallback for serverless demo
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbErr) {
      console.warn('DB error during login, attempting fallback:', dbErr);
      if (email === 'demo@garagesaas.com' && password === 'password123') {
        user = {
          id: 'cmv4zl4620001d96sd1e0qto2',
          email: 'demo@garagesaas.com',
          name: 'Demo Two-Wheeler Workshop',
          role: 'owner',
          garageType: 'two_wheeler',
          licenseStatus: 'active',
          password: await bcrypt.hash('password123', 10),
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if (email === 'test@garagesaas.com' && password === 'password123') {
        user = {
          id: 'cmv4zl4620002d96sd1e0qto3',
          email: 'test@garagesaas.com',
          name: 'Premium Multi-Brand Auto Center',
          role: 'owner',
          garageType: 'four_wheeler',
          licenseStatus: 'active',
          password: await bcrypt.hash('password123', 10),
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        throw dbErr;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check license status
    if (user.licenseStatus === 'expired' || 
        (user.expiresAt && new Date() > user.expiresAt)) {
      return NextResponse.json(
        { error: 'License expired. Please renew your license.' },
        { status: 403 }
      );
    }

    // Return user data (without password)
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
        details: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('neon') && !process.env.DATABASE_URL?.includes('postgres')
          ? `${error?.message || 'Database connection error'} (Check DATABASE_URL on Vercel)`
          : undefined
      },
      { status: 500 }
    );
  }
}
