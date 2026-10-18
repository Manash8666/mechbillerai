import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceOrEstimatePdf } from '@/lib/invoicePdfGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const typeParam = (searchParams.get('docType') || searchParams.get('type'))?.toUpperCase();
    
    let docType: 'INVOICE' | 'ESTIMATE' | 'WORK ORDER' | 'SOW BILL' | 'SOW ESTIMATE' = 'INVOICE';
    if (typeParam === 'ESTIMATE') {
      docType = 'ESTIMATE';
    } else if (typeParam === 'SOW' || typeParam === 'SOW_BILL' || typeParam === 'SOW BILL') {
      docType = 'SOW BILL';
    } else if (typeParam === 'SOW_ESTIMATE' || typeParam === 'SOW ESTIMATE') {
      docType = 'SOW ESTIMATE';
    } else if (typeParam === 'WORK ORDER') {
      docType = 'WORK ORDER';
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing invoice or jobcard id' }, { status: 400 });
    }

    // 1. Try finding invoice first
    let invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }, { jobCardId: id }],
      },
      include: {
        customer: true,
        items: true,
        jobCard: {
          include: {
            vehicle: true,
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
            branding: true,
          },
        },
      },
    });

    let jobCard: any = null;
    if (!invoice) {
      // 2. Fallback: Check if passed a JobCard ID or Job Number for an Estimate/Job Card Bill
      jobCard = await prisma.jobCard.findFirst({
        where: {
          OR: [{ id }, { jobNumber: id }],
        },
        include: {
          customer: true,
          vehicle: true,
          tasks: true,
          user: {
            select: {
              name: true,
              phone: true,
              email: true,
              branding: true,
            },
          },
        },
      });
    }

    if (!invoice && !jobCard) {
      return NextResponse.json({ error: 'Invoice or Job Card record not found' }, { status: 404 });
    }

    // Security Verification:
    const token = searchParams.get('token');
    const { getSessionUser } = await import('@/lib/auth');
    const authUser = await getSessionUser(request);
    const targetUserId = invoice ? invoice.userId : jobCard?.userId;
    const isOwner = authUser && authUser.userId === targetUserId;

    if (!isOwner && invoice && token) {
      const { verifyInvoiceToken } = await import('@/lib/hmacToken');
      const isTokenValid = verifyInvoiceToken(invoice.invoiceNumber, invoice.createdAt, token);
      if (!isTokenValid) {
        return NextResponse.json(
          {
            error: 'Access denied. Invalid secure bill token.',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    let customerName = 'Valued Customer';
    let customerPhone = '';
    let customerEmail = '';
    let customerAddress = '';
    let docNumber = id;
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    let paid = 0;
    let balance = 0;
    let dateStr = new Date().toLocaleDateString('en-GB');
    let garageName = 'MotoFit 2 Workshop';
    let garagePhone = '+91 63596 35416';
    let garageEmail = 'support@motoban.in';
    let garageAddress = 'Nigam Nagar HQ, Ahmedabad';
    let items: Array<{ description: string; details?: string | null; quantity: number; unitPrice: number; total: number }> = [
      { description: 'Automotive Service', quantity: 1, unitPrice: 0, total: 0 },
    ];

    if (invoice) {
      customerName = invoice.customer?.name || customerName;
      customerPhone = invoice.customer?.phone || '';
      customerEmail = invoice.customer?.email || '';
      customerAddress = invoice.customer?.address || '';
      docNumber = invoice.invoiceNumber;
      subtotal = invoice.subtotal;
      tax = invoice.tax;
      total = invoice.total;
      paid = invoice.paid;
      balance = invoice.balance;
      dateStr = invoice.createdAt.toLocaleDateString('en-GB');
      garageName = invoice.user?.branding?.garageName || invoice.user?.name || garageName;
      garagePhone = invoice.user?.phone || garagePhone;
      garageEmail = invoice.user?.email || garageEmail;
      if (invoice.items && invoice.items.length > 0) {
        items = invoice.items.map((it: any) => ({
          description: it.description,
          details: it.details || null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
        }));
      }
    } else if (jobCard) {
      customerName = jobCard.customer?.name || customerName;
      customerPhone = jobCard.customer?.phone || '';
      customerEmail = jobCard.customer?.email || '';
      customerAddress = jobCard.customer?.address || '';
      docNumber = jobCard.jobNumber.replace('JOB-', 'EST-');
      const est = jobCard.estimatedCost || jobCard.actualCost || 800;
      subtotal = Math.round(est * 0.82);
      tax = est - subtotal;
      total = est;
      balance = est;
      dateStr = jobCard.createdAt.toLocaleDateString('en-GB');
      garageName = jobCard.user?.branding?.garageName || jobCard.user?.name || garageName;
      garagePhone = jobCard.user?.phone || garagePhone;
      garageEmail = jobCard.user?.email || garageEmail;
      if (jobCard.tasks && jobCard.tasks.length > 0) {
        items = jobCard.tasks.map((t: any) => ({
          description: t.description || 'Service Task',
          details: 'Mechanical inspection & certified workshop execution',
          quantity: 1,
          unitPrice: Math.round(subtotal / jobCard.tasks.length),
          total: Math.round(subtotal / jobCard.tasks.length),
        }));
      } else {
        items = [
          {
            description: jobCard.description || 'Estimated Service & Parts Inspection',
            details: 'Comprehensive multi-point vehicle evaluation and servicing',
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal,
          },
        ];
      }
    }

    // Vehicle and Service Type Resolution
    const vehicleObj = invoice?.jobCard?.vehicle || jobCard?.vehicle;
    const vehicleData = vehicleObj
      ? {
          makeModel: `${vehicleObj.make || ''} ${vehicleObj.model || ''}`.trim() || 'Hero Xtreme 200 (2019 ABS Variant)',
          registrationNo: vehicleObj.registrationNo || 'As Per Estimate',
          refEstimate: invoice?.jobCard?.jobNumber ? `Ref: ${invoice.jobCard.jobNumber}` : undefined,
        }
      : {
          makeModel: 'Hero Xtreme 200 (2019 ABS Variant)',
          registrationNo: 'As Per Estimate',
        };

    const serviceType = invoice?.jobCard?.description || jobCard?.description || 'Half Engine Rebuild';

    const userBranding = invoice?.user?.branding || jobCard?.user?.branding;
    const paymentQrUrl = userBranding?.paymentQrUrl || null;
    const upiId = userBranding?.upiId || null;

    let upiQrDataUrl: string | null = null;
    if (balance > 0 && !paymentQrUrl) {
      try {
        const { generateUpiQrDataUrl } = await import('@/lib/upi');
        const vpa = upiId || 'motoban@icici';
        upiQrDataUrl = await generateUpiQrDataUrl({
          vpa,
          payeeName: garageName,
          amount: balance,
          invoiceNumber: docNumber,
          notes: `Invoice #${docNumber}`,
        });
      } catch (qrErr) {
        console.warn('Could not generate UPI QR code for PDF:', qrErr);
      }
    }

    const doc = generateInvoiceOrEstimatePdf({
      documentType: docType,
      documentNumber: docNumber,
      date: dateStr,
      serviceType,
      vehicle: vehicleData,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
      },
      garage: {
        name: garageName,
        phone: garagePhone,
        email: garageEmail,
        address: garageAddress,
        contacts: 'Manash: +91 63596 35416 (Client Service Manager) | Munna: +91 91232 93450 (Senior Mechanic)',
      },
      items,
      subtotal,
      tax,
      total,
      paid,
      balance,
      paymentQrUrl,
      upiId,
      upiQrDataUrl,
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${docType.replace(/\s+/g, '_')}_${docNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating Invoice/Estimate PDF:', error);
    return NextResponse.json({ error: 'Internal server error generating PDF' }, { status: 500 });
  }
}
