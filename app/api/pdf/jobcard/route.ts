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
        customer: {
          include: {
            vehicles: true,
          },
        },
        vehicle: true,
        tasks: {
          orderBy: { order: 'asc' },
        },
        user: {
          include: {
            branding: true,
          },
        },
      },
    });

    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    const branding = jobCard.user?.branding;
    const effectiveVehicle = jobCard.vehicle || (jobCard.customer as any)?.vehicles?.[0];

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
        registrationNo: effectiveVehicle?.registrationNo || 'General Vehicle',
        make: effectiveVehicle?.make || 'Vehicle',
        model: effectiveVehicle?.model || '',
        year: effectiveVehicle?.year || undefined,
        mileage: effectiveVehicle?.mileage || undefined,
        color: effectiveVehicle?.color || undefined,
        vin: effectiveVehicle?.vin || undefined,
      },
      tasks: (jobCard.tasks || []).map((t) => ({
        description: t.description,
        completed: t.completed,
      })),
      garageName: branding?.garageName || jobCard.user?.name || 'Automotive Service Workshop',
      garagePhone: (branding as any)?.phone || jobCard.user?.phone || undefined,
      garageAddress: (branding as any)?.address || undefined,
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
