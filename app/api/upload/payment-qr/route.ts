import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const formData = await request.formData();
    const file = formData.get('qrImage') as File | null;
    const upiId = (formData.get('upiId') as string || '').trim();

    let dataUrl: string | null = null;

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload a PNG, JPG, or WebP image of your QR code.' },
          { status: 400 }
        );
      }

      // Max size: 5MB
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 5MB.' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = file.type || 'image/png';
      dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    // Upsert into BrandingSettings
    const updated = await prisma.brandingSettings.upsert({
      where: { userId },
      update: {
        ...(dataUrl && { paymentQrUrl: dataUrl }),
        ...(upiId && { upiId }),
      },
      create: {
        userId,
        paymentQrUrl: dataUrl,
        upiId: upiId || null,
        primaryColor: '#C9A84C',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment QR code successfully saved and linked to your workshop SOW bills!',
      paymentQrUrl: updated.paymentQrUrl,
      upiId: updated.upiId,
    });
  } catch (error: any) {
    console.error('Error uploading payment QR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payment QR image' },
      { status: 500 }
    );
  }
}
