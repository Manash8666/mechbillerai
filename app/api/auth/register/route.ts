import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateLicenseKey } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, garageType } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create user with trial license (7 days)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        garageType: garageType || 'four_wheeler',
        licenseKey,
        licenseStatus: 'trial',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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

    return NextResponse.json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
