import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoicePdfData {
  documentType: 'INVOICE' | 'ESTIMATE' | 'WORK ORDER';
  documentNumber: string;
  date: string;
  dueDate?: string | null;
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
  };
  items: {
    description: string;
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
}

export function generateInvoiceOrEstimatePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  // Colors based on Red, Black & White reference image
  const COLOR_BLACK = [34, 34, 34]; // Charcoal dark #222222
  const COLOR_RED = [227, 27, 35]; // Racing Red #E31B23
  const COLOR_LIGHT_GRAY = [245, 245, 247]; // Soft table zebra tint
  const COLOR_MUTED_TEXT = [100, 100, 100];

  // 1. Top Angular Header Background: Dark charcoal block on left, angled to the right
  doc.setFillColor(34, 34, 34);
  doc.rect(0, 0, pageWidth, 52, 'F');

  // Red accent bar below dark header
  doc.setFillColor(227, 27, 35);
  doc.rect(0, 52, pageWidth, 8, 'F');

  // Shop / Brand Logo placeholder or Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const brandName = (data.garage.name || 'MECHBILLERAI GARAGE').toUpperCase();
  doc.text(brandName, margin, 24);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text('AUTOMOTIVE WORKSHOP & SMART BILLING SUITE', margin, 31);
  if (data.garage.address) {
    doc.text(data.garage.address, margin, 36);
  }

  // Right Side Header: Stylish Vehicle Icon Graphic
  const headerRightX = pageWidth - margin;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(227, 27, 35);
  doc.text(data.documentType, headerRightX, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`NO. #${data.documentNumber}`, headerRightX, 29, { align: 'right' });

  // Quick contact bar inside red banner (52 to 60 mm)
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');

  const contactWebsite = data.garage.website || 'www.garagesaas.com';
  const contactEmail = data.garage.email || 'support@garagesaas.com';
  const contactPhone = data.garage.phone || '+91 98765 43210';

  doc.text(`🌐  ${contactWebsite}`, margin, 57);
  doc.text(`✉  ${contactEmail}`, margin + 65, 57);
  doc.text(`📞  ${contactPhone}`, pageWidth - margin, 57, { align: 'right' });

  let currentY = 72;

  // 2. Document Title & Details
  doc.setTextColor(227, 27, 35);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.documentType, margin, currentY);

  doc.setTextColor(34, 34, 34);
  doc.setFontSize(11);
  doc.text(`NO. #${data.documentNumber}`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 8;

  // FROM & TO Address Section
  const colRightX = 130;

  // FROM
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('FROM:', margin, currentY);

  doc.setFontSize(12);
  doc.setTextColor(227, 27, 35);
  doc.text(data.garage.name || 'MechBillerAI Workshop', margin, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
  doc.text(data.garage.address || 'Ahmedabad, Gujarat, India', margin, currentY + 12);
  if (data.garage.phone) doc.text(data.garage.phone, margin, currentY + 17);
  if (data.garage.gstNumber) doc.text(`GSTIN: ${data.garage.gstNumber}`, margin, currentY + 22);

  // TO
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('TO / CLIENT:', colRightX, currentY);

  doc.setFontSize(12);
  doc.setTextColor(227, 27, 35);
  doc.text(data.customer.name, colRightX, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
  if (data.customer.address) doc.text(data.customer.address, colRightX, currentY + 12);
  if (data.customer.phone) doc.text(`Phone: ${data.customer.phone}`, colRightX, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text(`DATE:  ${data.date}`, colRightX, currentY + 23);
  if (data.dueDate) {
    doc.text(`DUE DATE:  ${data.dueDate}`, colRightX, currentY + 28);
  }

  currentY += 34;

  // 3. Items Table - Styled with Red & Charcoal Header
  const tableRows = data.items.map((item) => [
    item.description,
    String(item.quantity),
    `₹${item.unitPrice.toLocaleString('en-IN')}`,
    `₹${item.total.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['DESCRIPTION', 'QTY', 'PRICE', 'SUBTOTAL']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [227, 27, 35], // Red header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
    },
    bodyStyles: {
      textColor: [34, 34, 34],
      fontSize: 8.5,
      cellPadding: 3.2,
      lineWidth: 0.1,
      lineColor: [230, 230, 230],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250],
    },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || currentY + 50;

  // 4. Terms & Totals Section
  const totalsY = finalY + 8;
  const termsW = 100;
  const totalsW = 75;
  const totalsX = pageWidth - margin - totalsW;

  // Left: TERMS / NOTES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(34, 34, 34);
  doc.text('TERMS & CONDITIONS:', margin, totalsY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const termsText =
    data.terms ||
    'Payment due upon receipt or within 15 days. Warranty valid on original spare parts as per manufacturer terms. Thank you for your business!';
  const splitTerms = doc.splitTextToSize(termsText, termsW);
  doc.text(splitTerms, margin, totalsY + 9);

  // Right: SUB-TOTAL, TAX, TOTAL BOX
  let rightRowY = totalsY + 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 34, 34);
  doc.text('SUB-TOTAL', totalsX, rightRowY);
  doc.text(`₹${data.subtotal.toLocaleString('en-IN')}`, pageWidth - margin, rightRowY, { align: 'right' });

  rightRowY += 7;
  doc.text('TAX / GST (18%)', totalsX, rightRowY);
  doc.text(`₹${data.tax.toLocaleString('en-IN')}`, pageWidth - margin, rightRowY, { align: 'right' });

  if (data.discount && data.discount > 0) {
    rightRowY += 7;
    doc.text('DISCOUNT', totalsX, rightRowY);
    doc.text(`- ₹${data.discount.toLocaleString('en-IN')}`, pageWidth - margin, rightRowY, { align: 'right' });
  }

  // Solid Red Total Block
  rightRowY += 6;
  doc.setFillColor(227, 27, 35);
  doc.rect(totalsX - 4, rightRowY, totalsW + 4, 11, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL', totalsX, rightRowY + 7.5);
  doc.text(`₹${data.total.toLocaleString('en-IN')}`, pageWidth - margin, rightRowY + 7.5, { align: 'right' });

  // Big Bold: TOTAL DUE
  const totalDueY = rightRowY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(34, 34, 34);
  const balanceDue = data.balance !== undefined ? data.balance : data.total;
  doc.text(`TOTAL DUE: ₹${balanceDue.toLocaleString('en-IN')}`, margin, totalDueY);

  if (data.paid && data.paid > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 140, 60);
    doc.text(`Paid: ₹${data.paid.toLocaleString('en-IN')} via ${data.paymentMode || 'Cash/UPI'}`, margin, totalDueY + 6);
  }

  // 5. Bottom Graphic Accent Banner (Red & Dark Charcoal)
  doc.setFillColor(227, 27, 35);
  doc.rect(0, pageHeight - 10, pageWidth * 0.45, 10, 'F');

  doc.setFillColor(34, 34, 34);
  doc.rect(pageWidth * 0.45, pageHeight - 10, pageWidth * 0.55, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated with MechBillerAI • Smart Auto Workshop Management', pageWidth - margin, pageHeight - 4, {
    align: 'right',
  });

  return doc;
}
