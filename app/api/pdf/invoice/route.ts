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
        customer: {
          include: {
            vehicles: true,
          },
        },
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
    let garageName = 'Automotive Service Workshop';
    let garagePhone = '';
    let garageEmail = '';
    let garageAddress = '';
    let garageGstNumber: string | null = null;
    let garageWebsite: string | null = null;
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
      garagePhone = (invoice.user?.branding as any)?.phone || invoice.user?.phone || garagePhone;
      garageEmail = (invoice.user?.branding as any)?.email || invoice.user?.email || garageEmail;
      garageAddress = (invoice.user?.branding as any)?.address || '';
      garageGstNumber = (invoice.user?.branding as any)?.gstNumber || null;
      garageWebsite = (invoice.user?.branding as any)?.website || null;
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
      const est = jobCard.estimatedCost || jobCard.actualCost || 0;
      subtotal = Math.round(est * 0.82);
      tax = est - subtotal;
      total = est;
      balance = est;
      dateStr = jobCard.createdAt.toLocaleDateString('en-GB');
      garageName = jobCard.user?.branding?.garageName || jobCard.user?.name || garageName;
      garagePhone = jobCard.user?.branding?.phone || jobCard.user?.phone || garagePhone;
      garageEmail = jobCard.user?.branding?.email || jobCard.user?.email || garageEmail;
      garageAddress = jobCard.user?.branding?.address || '';
      garageGstNumber = jobCard.user?.branding?.gstNumber || null;
      garageWebsite = jobCard.user?.branding?.website || null;
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

    // Extract vehicle & service scope metadata from invoice notes
    let notesVehicleModel: string | null = null;
    let notesVehicleReg: string | null = null;
    let notesServiceScope: string | null = null;

    if (invoice?.notes) {
      try {
        const parsed = JSON.parse(invoice.notes);
        if (typeof parsed === 'object' && parsed !== null) {
          notesVehicleModel = parsed.vehicleModel || parsed.model || null;
          notesVehicleReg = parsed.vehicleReg || parsed.registrationNo || null;
          notesServiceScope = parsed.serviceScope || parsed.serviceType || null;
        }
      } catch {
        const vehMatch = /\[VEHICLE:\s*([^|\]]+)/i.exec(invoice.notes);
        const regMatch = /REG:\s*([^|\]]+)/i.exec(invoice.notes);
        const scopeMatch = /SCOPE:\s*([^|\]]+)/i.exec(invoice.notes);
        if (vehMatch) notesVehicleModel = vehMatch[1].trim();
        if (regMatch) notesVehicleReg = regMatch[1].trim();
        if (scopeMatch) notesServiceScope = scopeMatch[1].trim();
      }
    }

    // Vehicle and Service Type Resolution
    const vehicleObj =
      invoice?.jobCard?.vehicle ||
      jobCard?.vehicle ||
      (invoice?.customer as any)?.vehicles?.[0] ||
      (jobCard?.customer as any)?.vehicles?.[0];

    const customerVehicleMakeModel =
      vehicleObj?.make && vehicleObj.make !== 'Standard Vehicle'
        ? `${vehicleObj.make || ''} ${vehicleObj.model || ''}`.trim()
        : null;

    // Detect if items mention Classic 350 or other motorcycle model
    const allItemText = items.map((i) => i.description).join(' ');
    const detectedModel =
      notesVehicleModel ||
      customerVehicleMakeModel ||
      (allItemText.toLowerCase().includes('classic') ? 'Royal Enfield Classic 350' : null) ||
      (allItemText.toLowerCase().includes('himalayan') ? 'Royal Enfield Himalayan 411' : null) ||
      'Royal Enfield Classic 350';

    const vehicleRegNo =
      notesVehicleReg ||
      vehicleObj?.registrationNo ||
      'As Per Estimate';

    const vehicleData = {
      makeModel: detectedModel,
      registrationNo: vehicleRegNo,
      refEstimate: invoice?.jobCard?.jobNumber ? `Ref: ${invoice.jobCard.jobNumber}` : undefined,
    };

    let defaultServiceScope = 'Precision Maintenance & Overhaul';
    if (detectedModel.includes('Classic 350')) {
      defaultServiceScope = 'Classic 350 Overhaul & Service';
    } else if (detectedModel.includes('Himalayan')) {
      defaultServiceScope = 'Himalayan 411 Rebuild & Service';
    }

    const serviceType =
      notesServiceScope ||
      invoice?.jobCard?.description ||
      jobCard?.description ||
      defaultServiceScope;

    const userBranding = invoice?.user?.branding || jobCard?.user?.branding;
    const paymentQrUrl = userBranding?.paymentQrUrl || null;
    const upiId = userBranding?.upiId || null;

    let upiQrDataUrl: string | null = null;
    if (balance > 0 && !paymentQrUrl && upiId) {
      try {
        const { generateUpiQrDataUrl } = await import('@/lib/upi');
        upiQrDataUrl = await generateUpiQrDataUrl({
          vpa: upiId,
          payeeName: garageName,
          amount: balance,
          invoiceNumber: docNumber,
          notes: `Invoice #${docNumber}`,
        });
      } catch (qrErr) {
        console.warn('Could not generate UPI QR code for PDF:', qrErr);
      }
    }

    let contactsStr = `${garageName} | Authorized Workshop Service & Technical Team`;
    if (userBranding?.tagline) {
      const phoneSuffix = garagePhone ? `: ${garagePhone}` : '';
      contactsStr = `${garageName}${phoneSuffix} | ${userBranding.tagline}`;
    } else if (garagePhone) {
      contactsStr = `${garageName}: ${garagePhone} | Workshop Service & Technical Team`;
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
        gstNumber: garageGstNumber,
        website: garageWebsite,
        contacts: contactsStr,
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
