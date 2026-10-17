import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceOrEstimatePdf } from '@/lib/invoicePdfGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const typeParam = (searchParams.get('docType') || searchParams.get('type'))?.toUpperCase();
    const docType: 'INVOICE' | 'ESTIMATE' | 'WORK ORDER' =
      typeParam === 'ESTIMATE' || typeParam === 'WORK ORDER' ? typeParam : 'INVOICE';

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
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
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
          tasks: true,
          user: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });
    }

    if (!invoice && !jobCard) {
      return NextResponse.json({ error: 'Invoice or Job Card record not found' }, { status: 404 });
    }

    // Security Verification:
    // 1. If requester is authenticated garage owner, grant access.
    // 2. If valid HMAC token is provided (customer link from WhatsApp), grant access.
    // 3. If downloaded directly from dashboard, grant access.
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
    let garageName = 'MotoBan Workshop';
    let garagePhone = '+91 99999 88888';
    let garageEmail = 'support@garagesaas.com';
    let items = [{ description: 'Automotive Service', quantity: 1, unitPrice: 0, total: 0 }];

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
      garageName = invoice.user?.name || garageName;
      garagePhone = invoice.user?.phone || garagePhone;
      garageEmail = invoice.user?.email || garageEmail;
      if (invoice.items && invoice.items.length > 0) {
        items = invoice.items.map((it) => ({
          description: it.description,
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
      garageName = jobCard.user?.name || garageName;
      garagePhone = jobCard.user?.phone || garagePhone;
      garageEmail = jobCard.user?.email || garageEmail;
      if (jobCard.tasks && jobCard.tasks.length > 0) {
        items = jobCard.tasks.map((t: any) => ({
          description: t.description || 'Service Task',
          quantity: 1,
          unitPrice: Math.round(subtotal / jobCard.tasks.length),
          total: Math.round(subtotal / jobCard.tasks.length),
        }));
      } else {
        items = [
          {
            description: jobCard.description || 'Estimated Service & Parts Inspection',
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal,
          },
        ];
      }
    }

    let upiQrDataUrl: string | null = null;
    if (balance > 0) {
      try {
        const { generateUpiQrDataUrl } = await import('@/lib/upi');
        const vpa = 'motoban@icici';
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
      },
      items,
      subtotal,
      tax,
      total,
      paid,
      balance,
      upiQrDataUrl,
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${docType}_${docNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating Invoice/Estimate PDF:', error);
    return NextResponse.json({ error: 'Internal server error generating PDF' }, { status: 500 });
  }
}
