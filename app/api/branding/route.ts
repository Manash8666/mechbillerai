import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET branding settings
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
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const branding = await prisma.brandingSettings.findUnique({
      where: { userId },
    });

    // Return default if not found
    if (!branding) {
      return NextResponse.json({
        userId,
        primaryColor: '#C9A84C',
        garageName: null,
        logoUrl: null,
      });
    }

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST/UPDATE branding settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      garageName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      canvasLightColor,
      canvasDarkColor,
      surfaceLightColor,
      surfaceDarkColor,
      textLightColor,
      textDarkColor,
      customCss,
    } = body;

    let targetUserId = userId;
    if (!targetUserId || targetUserId === 'undefined' || targetUserId === 'null') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@garagesaas.com' },
      });
      targetUserId = demoUser?.id || null;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const branding = await prisma.brandingSettings.upsert({
      where: { userId: targetUserId },
      update: {
        garageName,
        logoUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        canvasLightColor,
        canvasDarkColor,
        surfaceLightColor,
        surfaceDarkColor,
        textLightColor,
        textDarkColor,
        customCss,
      },
      create: {
        userId: targetUserId,
        garageName,
        logoUrl,
        primaryColor: primaryColor || '#C9A84C',
        secondaryColor,
        accentColor,
        canvasLightColor,
        canvasDarkColor,
        surfaceLightColor,
        surfaceDarkColor,
        textLightColor,
        textDarkColor,
        customCss,
      },
    });

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
