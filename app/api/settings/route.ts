import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET garage profile settings including GST status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    if (!userId || userId === 'undefined' || userId === 'null') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@garagesaas.com' },
      });
      userId = demoUser?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        garageType: true,
        licenseStatus: true,
        gstEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT/PATCH update garage settings (GST on/off toggle)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, gstEnabled, name } = body;
    let targetUserId = userId;
    if (!targetUserId || targetUserId === 'undefined' || targetUserId === 'null') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@garagesaas.com' },
      });
      targetUserId = demoUser?.id || null;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: { gstEnabled?: boolean; name?: string } = {};
    if (gstEnabled !== undefined) {
      updateData.gstEnabled = Boolean(gstEnabled);
    }
    if (name !== undefined) {
      updateData.name = name;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        garageType: true,
        licenseStatus: true,
        gstEnabled: true,
      },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
