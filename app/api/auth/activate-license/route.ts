import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, licenseKey, deviceId } = body;

    if (!userId || !licenseKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify license key belongs to user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.licenseKey !== licenseKey) {
      return NextResponse.json(
        { error: 'Invalid license key' },
        { status: 400 }
      );
    }

    // Check if already activated on different device
    if (user.deviceId && user.deviceId !== deviceId) {
      return NextResponse.json(
        { error: 'License already activated on another device' },
        { status: 400 }
      );
    }

    // Activate license (lifetime - no expiry)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseStatus: 'active',
        deviceId: deviceId,
        expiresAt: null, // Lifetime access
      },
      select: {
        id: true,
        email: true,
        name: true,
        licenseStatus: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      message: 'License activated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
