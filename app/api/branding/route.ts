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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subdomain: true, name: true, phone: true },
    });

    // Return default if not found
    if (!branding) {
      return NextResponse.json({
        userId,
        primaryColor: '#C9F31D',
        secondaryColor: '#FF5E14',
        accentColor: '#00F0FF',
        garageName: user?.name || null,
        logoUrl: null,
        paymentQrUrl: null,
        upiId: null,
        subdomain: user?.subdomain || null,
      });
    }

    return NextResponse.json({
      ...branding,
      subdomain: user?.subdomain || null,
    });
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
      paymentQrUrl,
      upiId,
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
        ...(paymentQrUrl !== undefined && { paymentQrUrl }),
        ...(upiId !== undefined && { upiId }),
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
        paymentQrUrl: paymentQrUrl || null,
        upiId: upiId || null,
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

    let updatedSubdomain: string | null = null;
    if (body.subdomain !== undefined) {
      const cleanSubdomain = (body.subdomain || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      if (cleanSubdomain) {
        const existing = await prisma.user.findFirst({
          where: {
            subdomain: cleanSubdomain,
            NOT: { id: userId },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: `The subdomain "${cleanSubdomain}.motoban.in" is already claimed by another workshop` },
            { status: 400 }
          );
        }
        await prisma.user.update({
          where: { id: userId },
          data: { subdomain: cleanSubdomain },
        });
        updatedSubdomain = cleanSubdomain;
      }
    }

    return NextResponse.json({
      message: 'Branding settings saved successfully',
      branding: {
        ...branding,
        subdomain: updatedSubdomain,
      },
    });
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
