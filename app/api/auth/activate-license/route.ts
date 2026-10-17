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

    const { isVipFreeGarage, VIP_FOUNDING_KEYS } = await import('@/lib/licensing');
    const cleanKey = (licenseKey || '').trim().toUpperCase();

    // Verify license key belongs to user OR is a recognized VIP Master Founder Key
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isVipFounderKey = VIP_FOUNDING_KEYS.includes(cleanKey);
    const isVipEmail = isVipFreeGarage(user.email);
    const isUserKey = user.licenseKey && user.licenseKey.toUpperCase() === cleanKey;

    if (!isUserKey && !isVipFounderKey && !isVipEmail) {
      return NextResponse.json(
        { error: 'Invalid license key. Please check your key or contact MotoBan Support.' },
        { status: 400 }
      );
    }

    // Check device lock only for normal keys (VIP master keys have unrestricted device usage)
    if (!isVipFounderKey && !isVipEmail && user.deviceId && user.deviceId !== deviceId) {
      return NextResponse.json(
        { error: 'License already activated on another device' },
        { status: 400 }
      );
    }

    // Determine status: VIP gets lifetime_free, others get active
    const newStatus = isVipFounderKey || isVipEmail ? 'lifetime_free' : 'active';

    // Activate license
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseStatus: newStatus,
        licenseKey: cleanKey,
        deviceId: deviceId || user.deviceId,
        expiresAt: null, // Full access
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
      message: isVipFounderKey || isVipEmail
        ? 'VIP Founding Garage License activated: 100% Free Lifetime Full Access granted!'
        : 'License activated successfully',
      user: updatedUser,
      isVip: isVipFounderKey || isVipEmail,
    });
  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
