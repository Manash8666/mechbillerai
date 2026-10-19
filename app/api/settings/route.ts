import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET garage profile settings including GST status, garage name, phone, etc.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const session = await getSessionUser(request);
    const userId = session?.userId || queryUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        garageType: true,
        licenseStatus: true,
        gstEnabled: true,
        createdAt: true,
        branding: {
          select: {
            garageName: true,
            logoUrl: true,
            upiId: true,
            primaryColor: true,
          },
        },
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

// PUT update garage settings (Password Reset, Name Change, GST on/off toggle, Garage Name, Phone)
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const session = await getSessionUser(request);
    const body = await request.json().catch(() => ({}));
    const targetUserId = session?.userId || body.userId || queryUserId;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized: User ID required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { branding: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const {
      gstEnabled,
      name,
      garageName,
      phone,
      currentPassword,
      newPassword,
      forceResetPassword,
    } = body;

    const userUpdateData: {
      gstEnabled?: boolean;
      name?: string;
      phone?: string;
      password?: string;
    } = {};

    // 1. Name Change (User Personal Name)
    if (typeof name === 'string' && name.trim()) {
      userUpdateData.name = name.trim();
    }

    // 2. Phone update
    if (typeof phone === 'string') {
      userUpdateData.phone = phone.trim();
    }

    // 3. GST Toggle
    if (gstEnabled !== undefined) {
      userUpdateData.gstEnabled = Boolean(gstEnabled);
    }

    // 4. Password Reset
    if (newPassword && typeof newPassword === 'string') {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // If current password provided, verify it
      if (currentPassword) {
        const isMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json(
            { error: 'Current password is incorrect. Please recheck your current password.' },
            { status: 400 }
          );
        }
      } else if (!forceResetPassword && session?.role !== 'owner' && session?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      // Hash and apply new password
      userUpdateData.password = bcrypt.hashSync(newPassword, 10);
    }

    // Perform User update
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: userUpdateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        garageType: true,
        licenseStatus: true,
        gstEnabled: true,
      },
    });

    // 5. Name Change (Workshop / Garage Business Name)
    let updatedGarageName = user.branding?.garageName;
    if (typeof garageName === 'string' && garageName.trim()) {
      updatedGarageName = garageName.trim();
      await prisma.brandingSettings.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          garageName: updatedGarageName,
        },
        update: {
          garageName: updatedGarageName,
        },
      });
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: {
        ...updatedUser,
        garageName: updatedGarageName,
      },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error updating settings' }, { status: 500 });
  }
}
