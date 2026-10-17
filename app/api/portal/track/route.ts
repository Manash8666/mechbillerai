import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regNo = searchParams.get('regNo')?.trim();
    const userId = searchParams.get('userId')?.trim();

    if (!regNo || !userId) {
      return NextResponse.json(
        { error: 'Vehicle registration number and garage ID are required' },
        { status: 400 }
      );
    }

    // Clean registration number (e.g. MH12DE5566 or MH-12-DE-5566)
    const normalizedReg = regNo.toUpperCase().replace(/\s+/g, '');

    const jobCard = await prisma.jobCard.findFirst({
      where: {
        userId,
        vehicle: {
          registrationNo: {
            contains: normalizedReg,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: true,
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: `No active job card found for vehicle plate "${regNo}". Please verify with the service desk.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobCard: {
        jobNumber: jobCard.jobNumber,
        status: jobCard.status,
        description: jobCard.description,
        estimatedCost: jobCard.estimatedCost,
        createdAt: jobCard.createdAt.toISOString(),
        customerName: jobCard.customer.name,
        vehicle: {
          registrationNo: jobCard.vehicle.registrationNo,
          make: jobCard.vehicle.make,
          model: jobCard.vehicle.model,
        },
        hasShieldProof: Boolean(jobCard.preInspectionShield),
        voiceNote: jobCard.voiceNote,
        tasks: jobCard.tasks.map((t) => ({
          description: t.description,
          completed: t.completed,
        })),
        pdfUrl: `/api/pdf/invoice?id=${jobCard.jobNumber}&docType=ESTIMATE`,
      },
    });
  } catch (error) {
    console.error('Error in portal vehicle tracking:', error);
    return NextResponse.json({ error: 'Internal server error tracking vehicle' }, { status: 500 });
  }
}
