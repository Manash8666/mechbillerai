import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAutomotiveTechnicalExplanation } from '@/lib/aiExplainer';

// Universal constructor that works seamlessly across all ESM/CJS bundlers, Next.js, and Node runtimes
function createPdfDoc(options: any): any {
  const Constructor: any =
    typeof jsPDF === 'function'
      ? jsPDF
    : (jsPDF as any)?.jsPDF || (jsPDF as any)?.default || jsPDF;
  return new Constructor(options);
}

function applyAutoTable(doc: any, options: any): void {
  const fn: any =
    typeof autoTable === 'function'
      ? autoTable
      : (autoTable as any)?.default || autoTable;
  fn(doc, options);
}

export interface InvoicePdfData {
  documentType: 'INVOICE' | 'ESTIMATE' | 'WORK ORDER' | 'SOW BILL' | 'SOW ESTIMATE';
  documentNumber: string;
  date: string;
  dueDate?: string | null;
  serviceType?: string | null;
  refEstimate?: string | null;
  vehicle?: {
    makeModel?: string | null;
    registrationNo?: string | null;
    refEstimate?: string | null;
  } | null;
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstNumber?: string | null;
  };
  garage: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    website?: string | null;
    gstNumber?: string | null;
    contacts?: string | null;
  };
  items: {
    description: string;
    details?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  paid?: number;
  balance?: number;
  paymentMode?: string | null;
  terms?: string;
  warrantyTitle?: string | null;
  warrantyText?: string | null;
  runInServices?: { title: string; desc: string }[] | null;
  paymentQrUrl?: string | null;
  upiId?: string | null;
  upiQrDataUrl?: string | null;
}

export function generateInvoiceOrEstimatePdf(data: InvoicePdfData): any {
  const doc = createPdfDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  const isEstimate = data.documentType === 'ESTIMATE' || data.documentType === 'SOW ESTIMATE';
  const isSow =
    data.documentType === 'SOW BILL' ||
    data.documentType === 'SOW ESTIMATE' ||
    Boolean(data.vehicle?.makeModel) ||
    data.items.some((it) => Boolean(it.details));

  const PRIMARY_COLOR: [number, number, number] = isEstimate ? [217, 119, 6] : [220, 38, 38]; // Amber for Estimate, Crimson Red for Invoice
  const SLATE_DARK: [number, number, number] = [11, 15, 25]; // #0B0F19 Midnight Titanium
  const ACCENT_RED: [number, number, number] = [220, 38, 38];

  // Clean background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 1. Top Architectural Header
  doc.setFillColor(...SLATE_DARK);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Contrast accent stripe
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 40, pageWidth, 2.5, 'F');

  // Garage Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const brandName = (data.garage.name || 'MOTOBAN GARAGE').toUpperCase();
  doc.text(brandName, margin, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 210, 220);
  const subTitle = data.garage.address
    ? `GENERAL MAINTENANCE & PRECISION SERVICING | ${data.garage.address.toUpperCase()}`
    : 'GENERAL MAINTENANCE & PRECISION SERVICING | HQ WORKSHOP';
  doc.text(subTitle, margin, 23);

  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 185);
  const garageContacts = [
    data.garage.phone ? `Phone: ${data.garage.phone}` : 'Phone: +91 99999 88888',
    data.garage.email || 'support@motoban.in',
    data.garage.website || 'https://motoban.in',
  ].join('   |   ');
  doc.text(garageContacts, margin, 30);

  // Document Type & Number Badge (Top Right)
  const rightX = pageWidth - margin;
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(rightX - 58, 9, 58, 11, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  const badgeLabel = isSow
    ? isEstimate
      ? 'SOW ESTIMATE'
      : 'SOW BILL'
    : data.documentType;
  doc.text(badgeLabel, rightX - 29, 16.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`DOC #${data.documentNumber}`, rightX, 27, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 195);
  doc.text(`Date: ${data.date}`, rightX, 33, { align: 'right' });

  let currentY = 48;

  // 2. SOW Scope Sub-Header or Standard Customer/Terms Cards
  if (isSow) {
    // SOW Scope Banner Bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...PRIMARY_COLOR);
    const sowTitle = isEstimate
      ? `SCOPE OF WORK (SOW) ESTIMATE — ${(data.serviceType || 'ENGINE REBUILD & SERVICING').toUpperCase()}`
      : `SCOPE OF WORK (SOW) BILL — ${(data.serviceType || 'ENGINE REBUILD & SERVICING').toUpperCase()}`;
    doc.text(sowTitle, margin, currentY);

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY + 2.5, rightX, currentY + 2.5);

    currentY += 7;

    // 3-Column SOW Metadata Grid
    const colW = (pageWidth - margin * 2) / 3;

    // Column 1: Vehicle Make & Model
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('VEHICLE MAKE & MODEL', margin, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(data.vehicle?.makeModel || 'Motorcycle / Vehicle Specification', margin, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    const refText = data.refEstimate || data.vehicle?.refEstimate || `Customer: ${data.customer.name}`;
    doc.text(`Ref Estimate: ${refText}`, margin, currentY + 9.5);

    // Column 2: Job Card / Service Type
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('JOB CARD / SERVICE TYPE', margin + colW, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(data.serviceType || 'Half Engine Rebuild', margin + colW, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    const regText = data.vehicle?.registrationNo || 'Reg: As Per Estimate';
    doc.text(`Reg: ${regText}`, margin + colW, currentY + 9.5);

    // Column 3: Invoice ID / Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('INVOICE ID / DATE', rightX, currentY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(data.documentNumber, rightX, currentY + 5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(data.date, rightX, currentY + 9.5, { align: 'right' });

    currentY += 15;
  } else {
    // Standard Dual Cards: Customer Card + Terms Card
    const cardW = (pageWidth - margin * 2 - 8) / 2;
    const infoCardH = 32;

    const drawCard = (x: number, y: number, w: number, h: number, title: string) => {
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, 2, 2, 'FD');

      doc.setFillColor(243, 244, 246);
      doc.roundedRect(x, y, w, 6, 2, 2, 'F');
      doc.rect(x, y + 4, w, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text(title.toUpperCase(), x + 4, y + 4.5);
    };

    drawCard(margin, currentY, cardW, infoCardH, 'Billed To (Customer Details)');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text(data.customer.name || 'Walk-in Customer', margin + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`Phone: ${data.customer.phone || 'N/A'}`, margin + 4, currentY + 17.5);
    doc.text(`Email: ${data.customer.email || 'customer@garagesaas.com'}`, margin + 4, currentY + 22.5);
    doc.text(`Address: ${data.customer.address || 'Local Region'}`, margin + 4, currentY + 27.5);

    const rightCardX = margin + cardW + 8;
    drawCard(rightCardX, currentY, cardW, infoCardH, 'Document Metadata & Terms');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`Payment Mode:`, rightCardX + 4, currentY + 12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(data.paymentMode || 'UPI / Cashless', rightCardX + 30, currentY + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Due Date:`, rightCardX + 4, currentY + 18.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(data.dueDate || data.date, rightCardX + 30, currentY + 18.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`GSTIN Registration:`, rightCardX + 4, currentY + 24.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(data.garage.gstNumber || '24AABCM1234F1Z5', rightCardX + 30, currentY + 24.5);

    currentY += infoCardH + 6;
  }

  // 3. Itemized Services & Parts Table with Two-Tier Titles & Detailed Explanations
  const colDescWidth = 102;
  const tableData = data.items.map((item, idx) => {
    const title = (item.description || 'Service Work').toUpperCase();
    let details = item.details ? item.details.trim() : '';

    // If details are empty, automatically generate technical explanation for SOW
    if (!details && isSow) {
      details = getAutomotiveTechnicalExplanation(item.description);
    }

    // Calculate lines required for cell height allocation
    let combinedText = title;
    if (details) {
      const detailLines = doc.splitTextToSize(details, colDescWidth - 6);
      combinedText = `${title}\n${detailLines.join('\n')}`;
    }

    return [
      (idx + 1).toString(),
      combinedText,
      item.quantity.toString(),
      Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];
  });

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['S.NO.', 'SERVICE ITEM / SPARE PART DESCRIPTION', 'QTY', 'RATE (₹)', 'AMOUNT (₹)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: SLATE_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: colDescWidth },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (hookData: any) => {
      // Custom two-tone typography for Description column
      if (hookData.section === 'body' && hookData.column.index === 1) {
        const item = data.items[hookData.row.index];
        if (item) {
          // Clear standard single-tone text
          doc.setFillColor(255, 255, 255);
          doc.rect(
            hookData.cell.x + 0.2,
            hookData.cell.y + 0.2,
            hookData.cell.width - 0.4,
            hookData.cell.height - 0.4,
            'F'
          );

          const startX = hookData.cell.x + 3;
          const title = (item.description || '').toUpperCase();
          let details = item.details ? item.details.trim() : '';
          if (!details && isSow) {
            details = getAutomotiveTechnicalExplanation(item.description);
          }

          // 1. Title: Bold, Dark, Uppercase
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.8);
          doc.setTextColor(17, 24, 39);
          doc.text(title, startX, hookData.cell.y + 4.2);

          // 2. Subtext: Clean, Muted Explanation of what the work or spare part does
          if (details) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.6);
            doc.setTextColor(100, 116, 139);
            const detailLines = doc.splitTextToSize(details, hookData.cell.width - 6);
            doc.text(detailLines, startX, hookData.cell.y + 7.8);
          }
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // 4. Financial Calculations Ledger (Right-Aligned)
  const summaryBoxW = 80;
  const summaryBoxX = pageWidth - margin - summaryBoxW;

  const discountAmount = data.discount || 0;
  const subtotal = data.subtotal || 0;
  const grossSubtotal = subtotal + discountAmount;

  const addLedgerRow = (lbl: string, val: string, y: number, isBold = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 7.8);
    doc.setTextColor(
      isAccent ? PRIMARY_COLOR[0] : 75,
      isAccent ? PRIMARY_COLOR[1] : 85,
      isAccent ? PRIMARY_COLOR[2] : 99
    );
    doc.text(lbl, summaryBoxX + 4, y);
    doc.text(val, summaryBoxX + summaryBoxW - 4, y, { align: 'right' });
  };

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(summaryBoxX, finalY, summaryBoxW, discountAmount > 0 ? 32 : 26, 2, 2, 'FD');

  let ledgerY = finalY + 6;
  addLedgerRow(
    isEstimate ? 'Estimated Gross Subtotal:' : 'Gross Subtotal:',
    `₹ ${grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ledgerY
  );

  if (discountAmount > 0) {
    ledgerY += 5.5;
    const discountPercent = grossSubtotal > 0 ? Math.round((discountAmount / grossSubtotal) * 100) : 0;
    addLedgerRow(
      `Special Workshop Discount (${discountPercent}%):`,
      `- ₹ ${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ledgerY,
      false,
      true
    );
  }

  ledgerY += 6;
  doc.setDrawColor(209, 213, 219);
  doc.line(summaryBoxX + 4, ledgerY - 2, summaryBoxX + summaryBoxW - 4, ledgerY - 2);

  // Total Highlight
  doc.setFillColor(...SLATE_DARK);
  doc.roundedRect(summaryBoxX + 2, ledgerY, summaryBoxW - 4, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Total Payable Amount:', summaryBoxX + 5, ledgerY + 5.5);
  doc.text(
    `₹ ${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    summaryBoxX + summaryBoxW - 5,
    ledgerY + 5.5,
    { align: 'right' }
  );

  // 4b. Payment Acceptance & UPI QR Scanner Card (Left-Aligned, opposite Financial Ledger)
  const qrImage = data.paymentQrUrl || data.upiQrDataUrl || null;
  const paymentBoxX = margin;
  const paymentBoxW = summaryBoxX - margin - 4;
  const paymentBoxH = Math.max(34, ledgerY + 8 - finalY);

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(paymentBoxX, finalY, paymentBoxW, paymentBoxH, 2, 2, 'FD');

  // Header band
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(paymentBoxX, finalY, paymentBoxW, 5.5, 2, 2, 'F');
  doc.rect(paymentBoxX, finalY + 3.5, paymentBoxW, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(31, 41, 55);
  doc.text('SCAN TO PAY VIA ANY UPI APP (GPAY / PHONEPE / PAYTM / BHIM)', paymentBoxX + 3, finalY + 4);

  const qrSize = 24;
  const qrX = paymentBoxX + 3.5;
  const qrY = finalY + 7.5;

  if (qrImage) {
    try {
      // White container behind QR for clean contrast
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 1.5, 1.5, 'FD');

      let format = 'PNG';
      if (qrImage.includes('image/jpeg') || qrImage.includes('image/jpg')) format = 'JPEG';
      else if (qrImage.includes('image/webp')) format = 'WEBP';

      doc.addImage(qrImage, format, qrX + 0.8, qrY + 0.8, qrSize - 1.6, qrSize - 1.6);
    } catch (imgErr) {
      console.warn('Could not render QR code image on PDF:', imgErr);
    }
  } else {
    // Placeholder container when no QR uploaded
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text('UPI QR', qrX + qrSize / 2, qrY + qrSize / 2 - 1, { align: 'center' });
    doc.setFontSize(5);
    doc.text('ACCEPTED HERE', qrX + qrSize / 2, qrY + qrSize / 2 + 3, { align: 'center' });
  }

  // Payment Details Text beside QR
  const infoX = qrX + qrSize + 4;
  const maxInfoW = paymentBoxW - (qrSize + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);
  const payee = data.garage.name || 'Workshop Account';
  doc.text(payee.slice(0, 32), infoX, qrY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(75, 85, 99);
  const upiIdDisplay = data.upiId || 'Personal GPay / PhonePe / Counter QR';
  doc.text(`UPI: ${upiIdDisplay}`, infoX, qrY + 8.5);

  doc.setFontSize(5.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Scan with Google Pay, PhonePe, Paytm, or any UPI app.', infoX, qrY + 13, { maxWidth: maxInfoW });
  doc.text('Instant digital confirmation upon payment.', infoX, qrY + 17, { maxWidth: maxInfoW });

  // Amount badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`Total Payable: ₹ ${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, infoX, qrY + 22.5);

  let bottomCardsY = Math.max(ledgerY + 12, finalY + paymentBoxH + 4);

  // 5. Dual Execution Cards: 1-Year Warranty (Left) + Post-Rebuild Run-In Service Breakdown (Right)
  if (isSow) {
    const boxW = (pageWidth - margin * 2 - 6) / 2;
    const boxH = 34;

    // Left Card: 1 YEAR ENGINE REBUILD WARRANTY & WORKSHOP EXECUTION
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(16, 185, 129); // Emerald / Teal border
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, bottomCardsY, boxW, boxH, 2, 2, 'FD');

    // Header strip
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, bottomCardsY, boxW, 5.5, 2, 2, 'F');
    doc.rect(margin, bottomCardsY + 3.5, boxW, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    const wTitle = data.warrantyTitle || '1 YEAR ENGINE REBUILD WARRANTY & WORKSHOP EXECUTION';
    doc.text(wTitle.toUpperCase(), margin + 3, bottomCardsY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(55, 65, 81);
    const defaultWarranty =
      data.warrantyText ||
      `Top-end rebuild executed at ${data.garage.name || 'MotoBan Workshop'}. Covered by a 1-Year Warranty on cylinder compression, engine oil consumption, and valve train integrity. Clutch plates excluded per prior inspection. Warranty remains valid upon strict adherence to the post-rebuild run-in schedule. Standard base pricing applied.`;
    const wLines = doc.splitTextToSize(defaultWarranty, boxW - 6);
    doc.text(wLines, margin + 3, bottomCardsY + 9.5);

    // Right Card: POST-REBUILD RUN-IN SERVICE STRUCTURE BREAKDOWN
    const rightBoxX = margin + boxW + 6;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(37, 99, 235); // Sapphire Blue border
    doc.roundedRect(rightBoxX, bottomCardsY, boxW, boxH, 2, 2, 'FD');

    // Header strip
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(rightBoxX, bottomCardsY, boxW, 5.5, 2, 2, 'F');
    doc.rect(rightBoxX, bottomCardsY + 3.5, boxW, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text('POST-REBUILD RUN-IN SERVICE STRUCTURE BREAKDOWN', rightBoxX + 3, bottomCardsY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(55, 65, 81);
    const runInItems = data.runInServices || [
      { title: 'Service 1 (450 Kms):', desc: 'First engine oil flush, Motul drain-and-refill, strainer cleaning, tappet valve lash check.' },
      { title: 'Service 2 (1,200 Kms):', desc: 'Secondary inspection, fresh engine oil & filter replacement, chain slack tuning.' },
      { title: 'Service 3 (1,800 Kms):', desc: 'Run-in completion check, spark plug check, throttle body/air-fuel tuning.' },
      { title: 'Service 4 (2,000+ Kms):', desc: 'Routine periodic maintenance schedule every 2,000 Kms thereafter.' },
    ];

    let rY = bottomCardsY + 9;
    runInItems.forEach((r) => {
      doc.setFont('helvetica', 'bold');
      doc.text(r.title, rightBoxX + 3, rY);
      doc.setFont('helvetica', 'normal');
      doc.text(r.desc, rightBoxX + 24, rY, { maxWidth: boxW - 27 });
      rY += 5.5;
    });

    bottomCardsY += boxH + 5;
  } else {
    // Standard Terms
    bottomCardsY = finalY + 4;
  }

  // 6. Workshop Contacts & Authorized Signatory Line
  const footerY = Math.max(bottomCardsY, pageHeight - 34);

  // Workshop Contacts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(17, 24, 39);
  const contactHead = `WORKSHOP CONTACTS (${(data.garage.address || 'HQ').toUpperCase()})`;
  doc.text(contactHead, margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(75, 85, 99);
  const contactsLine =
    data.garage.contacts ||
    `${data.garage.name}: ${data.garage.phone || '+91 63596 35416'} | Client Service Manager & Technical Team`;
  doc.text(contactsLine, margin, footerY + 4.5);

  // Tagline
  doc.setFontSize(5.8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `${data.garage.name} | High-Performance Precision Engine Rebuilds & Tuning | Electronically generated document.`,
    margin,
    footerY + 8.5
  );

  // Authorized Signatory
  const signWidth = 46;
  const signX = rightX - signWidth;
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Authorized Signatory', signX + signWidth / 2, footerY + 2, { align: 'center' });

  doc.setDrawColor(75, 85, 99);
  doc.setLineWidth(0.3);
  doc.line(signX, footerY + 4, rightX, footerY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(55, 65, 81);
  doc.text('Authorized Signatory', signX + signWidth / 2, footerY + 7.5, { align: 'center' });

  return doc;
}
