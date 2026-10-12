import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET branding settings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const branding = await prisma.brandingSettings.upsert({
      where: { userId },
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
        userId,
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
