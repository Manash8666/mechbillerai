import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const period = (url.searchParams.get('period') || 'Q3').toUpperCase();
    const fy = url.searchParams.get('fy') || '2026-2027';
    const exportFormat = url.searchParams.get('format'); // 'csv' or null

    const session = await getSessionUser(request);
    const userId = session?.userId || queryUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { branding: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine start and end years from FY (e.g. "2026-2027" -> startYear = 2026, endYear = 2027)
    const [startYearStr, endYearStr] = fy.split('-');
    const startYear = parseInt(startYearStr, 10) || 2026;
    const endYear = parseInt(endYearStr, 10) || startYear + 1;

    let startDate: Date;
    let endDate: Date;
    let periodLabel = '';

    switch (period) {
      case 'Q1':
        startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); // 01 Apr
        endDate = new Date(Date.UTC(startYear, 5, 30, 23, 59, 59, 999)); // 30 Jun
        periodLabel = `Q1 (Apr ${startYear} – Jun ${startYear})`;
        break;
      case 'Q2':
        startDate = new Date(Date.UTC(startYear, 6, 1, 0, 0, 0)); // 01 Jul
        endDate = new Date(Date.UTC(startYear, 8, 30, 23, 59, 59, 999)); // 30 Sep
        periodLabel = `Q2 (Jul ${startYear} – Sep ${startYear})`;
        break;
      case 'Q3':
        startDate = new Date(Date.UTC(startYear, 9, 1, 0, 0, 0)); // 01 Oct
        endDate = new Date(Date.UTC(startYear, 11, 31, 23, 59, 59, 999)); // 31 Dec
        periodLabel = `Q3 (Oct ${startYear} – Dec ${startYear})`;
        break;
      case 'Q4':
        startDate = new Date(Date.UTC(endYear, 0, 1, 0, 0, 0)); // 01 Jan
        endDate = new Date(Date.UTC(endYear, 2, 31, 23, 59, 59, 999)); // 31 Mar
        periodLabel = `Q4 (Jan ${endYear} – Mar ${endYear})`;
        break;
      case 'H1':
        startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); // 01 Apr
        endDate = new Date(Date.UTC(startYear, 8, 30, 23, 59, 59, 999)); // 30 Sep
        periodLabel = `Half-Yearly H1 (Apr ${startYear} – Sep ${startYear})`;
        break;
      case 'H2':
        startDate = new Date(Date.UTC(startYear, 9, 1, 0, 0, 0)); // 01 Oct
        endDate = new Date(Date.UTC(endYear, 2, 31, 23, 59, 59, 999)); // 31 Mar
        periodLabel = `Half-Yearly H2 (Oct ${startYear} – Mar ${endYear})`;
        break;
      case 'YEARLY':
      default:
        startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); // 01 Apr
        endDate = new Date(Date.UTC(endYear, 2, 31, 23, 59, 59, 999)); // 31 Mar
        periodLabel = `Full Financial Year (FY ${startYear}-${endYear})`;
        break;
    }

    // Allow custom date override if provided
    const customStart = url.searchParams.get('startDate');
    const customEnd = url.searchParams.get('endDate');
    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      periodLabel = `Custom Range (${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)})`;
    }

    // Fetch invoices in date range for this garage
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
        jobCard: {
          include: {
            vehicle: true,
          },
        },
      },
      orderBy: {
        invoiceDate: 'asc',
      },
    });

    // Compute CA financial metrics
    let totalGrossSales = 0;
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    let b2bInvoicesCount = 0;
    let b2bTaxable = 0;
    let b2bTax = 0;
    let b2bTotal = 0;

    let b2cInvoicesCount = 0;
    let b2cTaxable = 0;
    let b2cTax = 0;
    let b2cTotal = 0;

    let laborRevenue = 0;
    let laborTaxable = 0;
    let sparesRevenue = 0;
    let sparesTaxable = 0;

    let cashCollected = 0;
    let upiCollected = 0;
    let cardCollected = 0;
    let bankCollected = 0;

    const invoiceRegister = invoices.map((inv) => {
      totalGrossSales += inv.total;
      totalDiscount += inv.discount || 0;
      totalPaid += inv.paid || 0;
      totalBalance += inv.balance || 0;

      const isB2B = Boolean(inv.customer.gstNumber && inv.customer.gstNumber.trim().length >= 15);
      const invoiceTax = inv.tax || 0;
      const invoiceTaxable = inv.subtotal || inv.total - invoiceTax;

      totalTaxableValue += invoiceTaxable;

      // GST Split (Standard 9% CGST + 9% SGST)
      const cgst = Math.round((invoiceTax / 2) * 100) / 100;
      const sgst = Math.round((invoiceTax / 2) * 100) / 100;
      totalCgst += cgst;
      totalSgst += sgst;

      if (isB2B) {
        b2bInvoicesCount++;
        b2bTaxable += invoiceTaxable;
        b2bTax += invoiceTax;
        b2bTotal += inv.total;
      } else {
        b2cInvoicesCount++;
        b2cTaxable += invoiceTaxable;
        b2cTax += invoiceTax;
        b2cTotal += inv.total;
      }

      // Analyze line items for labor vs spares
      for (const item of inv.items) {
        const desc = (item.description + ' ' + (item.details || '')).toLowerCase();
        const isLabor =
          desc.includes('labour') ||
          desc.includes('labor') ||
          desc.includes('service') ||
          desc.includes('machining') ||
          desc.includes('lathe') ||
          desc.includes('teardown') ||
          desc.includes('fitting') ||
          desc.includes('overhaul') ||
          desc.includes('washing') ||
          desc.includes('alignment');

        if (isLabor) {
          laborRevenue += item.total;
          laborTaxable += item.unitPrice * item.quantity;
        } else {
          sparesRevenue += item.total;
          sparesTaxable += item.unitPrice * item.quantity;
        }
      }

      // Payment reconciliation
      const pMode = (inv.paymentMode || 'cash').toLowerCase();
      if (pMode.includes('upi') || pMode.includes('qr') || pMode.includes('gpay') || pMode.includes('phonepe')) {
        upiCollected += inv.paid;
      } else if (pMode.includes('card')) {
        cardCollected += inv.paid;
      } else if (pMode.includes('bank') || pMode.includes('neft') || pMode.includes('rtgs')) {
        bankCollected += inv.paid;
      } else {
        cashCollected += inv.paid;
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate.toISOString().slice(0, 10),
        customerName: inv.customer.name,
        customerPhone: inv.customer.phone,
        gstin: inv.customer.gstNumber || 'B2C Retail',
        isB2B,
        vehicle: inv.jobCard?.vehicle
          ? `${inv.jobCard.vehicle.make} ${inv.jobCard.vehicle.model} (${inv.jobCard.vehicle.registrationNo})`
          : 'Motorcycle / Vehicle',
        subtotal: inv.subtotal,
        discount: inv.discount,
        taxable: invoiceTaxable,
        cgst,
        sgst,
        totalTax: invoiceTax,
        grandTotal: inv.total,
        paid: inv.paid,
        balance: inv.balance,
        status: inv.status,
        paymentMode: inv.paymentMode || 'cash',
        itemsCount: inv.items.length,
      };
    });

    const reportData = {
      financialYear: fy,
      period,
      periodLabel,
      dateRange: {
        from: startDate.toISOString().slice(0, 10),
        to: endDate.toISOString().slice(0, 10),
      },
      workshop: {
        garageName: user.branding?.garageName || user.name || 'MotoFit 2 Workshop',
        ownerName: user.name,
        email: user.email,
        phone: user.phone || '7259625881',
        gstEnabled: user.gstEnabled,
      },
      summary: {
        totalInvoices: invoices.length,
        totalGrossSales,
        totalTaxableValue,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGstCollected: totalCgst + totalSgst + totalIgst,
        totalDiscount,
        totalPaid,
        totalReceivables: totalBalance,
      },
      gstReturnSplit: {
        b2b: {
          invoiceCount: b2bInvoicesCount,
          taxableValue: b2bTaxable,
          totalTax: b2bTax,
          grossTotal: b2bTotal,
        },
        b2c: {
          invoiceCount: b2cInvoicesCount,
          taxableValue: b2cTaxable,
          totalTax: b2cTax,
          grossTotal: b2cTotal,
        },
      },
      revenueStreamSplit: {
        laborIncome: {
          sacCode: '9987',
          description: 'Maintenance, Overhaul & Repair Services',
          taxableValue: laborTaxable,
          grossRevenue: laborRevenue,
        },
        sparesAndConsumables: {
          hsnCode: '8714 / 2710',
          description: 'Parts, Lubricants & Consumables',
          taxableValue: sparesTaxable,
          grossRevenue: sparesRevenue,
        },
      },
      collectionBreakdown: {
        cash: cashCollected,
        upiQr: upiCollected,
        card: cardCollected,
        bank: bankCollected,
        outstanding: totalBalance,
      },
      invoiceRegister,
    };

    // If format=csv is requested, stream down a CA compliant CSV
    if (exportFormat === 'csv') {
      const header = [
        'Invoice Number',
        'Date',
        'Customer Name',
        'Customer Phone',
        'Customer GSTIN',
        'Vehicle Details',
        'Taxable Value (INR)',
        'CGST 9% (INR)',
        'SGST 9% (INR)',
        'Total Tax (INR)',
        'Total Invoice Value (INR)',
        'Paid (INR)',
        'Outstanding Balance (INR)',
        'Payment Mode',
        'Status',
      ].join(',');

      const rows = invoiceRegister.map((row) =>
        [
          `"${row.invoiceNumber}"`,
          `"${row.date}"`,
          `"${row.customerName.replace(/"/g, '""')}"`,
          `"${row.customerPhone}"`,
          `"${row.gstin}"`,
          `"${row.vehicle.replace(/"/g, '""')}"`,
          row.taxable.toFixed(2),
          row.cgst.toFixed(2),
          row.sgst.toFixed(2),
          row.totalTax.toFixed(2),
          row.grandTotal.toFixed(2),
          row.paid.toFixed(2),
          row.balance.toFixed(2),
          `"${row.paymentMode}"`,
          `"${row.status}"`,
        ].join(',')
      );

      const csvContent = [
        `# MOTOBAN CA AUDIT REPORT — ${periodLabel}`,
        `# Workshop: ${reportData.workshop.garageName} | Owner: ${reportData.workshop.ownerName}`,
        `# Period: ${reportData.dateRange.from} to ${reportData.dateRange.to}`,
        `# Total Gross Turnover: INR ${totalGrossSales.toFixed(2)} | Total GST Collected: INR ${(totalCgst + totalSgst).toFixed(2)}`,
        '',
        header,
        ...rows,
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="CA_Audit_Report_${fy}_${period}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating CA audit report:', error);
    return NextResponse.json(
      { error: 'Internal server error compiling CA audit report' },
      { status: 500 }
    );
  }
}
