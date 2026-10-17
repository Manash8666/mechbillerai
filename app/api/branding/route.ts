import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET branding settings
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const branding = await prisma.brandingSettings.findUnique({
      where: { userId },
    });

    // Return default if not found
    if (!branding) {
      return NextResponse.json({
        userId,
        primaryColor: '#C9F31D',
        secondaryColor: '#FF5E14',
        accentColor: '#00F0FF',
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
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const body = await request.json();
    const {
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
        primaryColor: primaryColor || '#C9F31D',
        secondaryColor: secondaryColor || '#FF5E14',
        accentColor: accentColor || '#00F0FF',
        canvasLightColor,
        canvasDarkColor,
        surfaceLightColor,
        surfaceDarkColor,
        textLightColor,
        textDarkColor,
        customCss,
      },
    });

    return NextResponse.json({
      message: 'Branding settings saved successfully',
      branding,
    });
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
