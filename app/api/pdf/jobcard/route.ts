import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateJobCardPdf } from '@/lib/jobCardPdfGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing job card id' }, { status: 400 });
    }

    const jobCard = await prisma.jobCard.findFirst({
      where: {
        OR: [{ id }, { jobNumber: id }],
      },
      include: {
        customer: true,
        vehicle: true,
        tasks: {
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    const doc = generateJobCardPdf({
      jobNumber: jobCard.jobNumber,
      createdAt: jobCard.createdAt.toISOString(),
      status: jobCard.status,
      description: jobCard.description,
      estimatedCost: jobCard.estimatedCost || undefined,
      actualCost: jobCard.actualCost || undefined,
      voiceNote: jobCard.voiceNote,
      preInspectionShield: jobCard.preInspectionShield,
      customer: {
        name: jobCard.customer?.name || 'Valued Customer',
        phone: jobCard.customer?.phone || 'N/A',
        email: jobCard.customer?.email || undefined,
        address: jobCard.customer?.address || undefined,
      },
      vehicle: {
        registrationNo: jobCard.vehicle?.registrationNo || 'General Vehicle',
        make: jobCard.vehicle?.make || 'Vehicle',
        model: jobCard.vehicle?.model || '',
        year: jobCard.vehicle?.year || undefined,
        mileage: jobCard.vehicle?.mileage || undefined,
        color: jobCard.vehicle?.color || undefined,
        vin: jobCard.vehicle?.vin || undefined,
      },
      tasks: (jobCard.tasks || []).map((t) => ({
        description: t.description,
        completed: t.completed,
      })),
      garageName: jobCard.user?.name || 'MotoBan Workshop',
      garagePhone: jobCard.user?.phone || '+91 99999 88888',
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="JobCard_${jobCard.jobNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating Job Card PDF:', error);
    return NextResponse.json({ error: 'Internal server error generating PDF' }, { status: 500 });
  }
}
