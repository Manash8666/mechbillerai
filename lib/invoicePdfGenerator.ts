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

  const isEstimate = data.documentType === 'ESTIMATE';
  const PRIMARY_COLOR: [number, number, number] = isEstimate ? [217, 119, 6] : [220, 38, 38]; // Amber for Estimate, Crimson Red for Invoice
  const SLATE_DARK: [number, number, number] = [24, 24, 32];

  // Clean background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 1. Top Architectural Header: Asymmetrical Obsidian Slate with Dynamic Angular Crimson/Amber Notch
  doc.setFillColor(...SLATE_DARK);
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Dynamic contrast stripe
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 44, pageWidth, 3, 'F');

  // Garage Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const brandName = (data.garage.name || 'MOTOBAN GARAGE').toUpperCase();
  doc.text(brandName, margin, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 210, 220);
  doc.text('AUTOMOTIVE WORKSHOP & SMART BILLING SUITE', margin, 25);

  doc.setFontSize(8);
  doc.setTextColor(170, 170, 185);
  const garageContacts = [
    data.garage.phone ? `Phone: ${data.garage.phone}` : 'Phone: +91 99999 88888',
    data.garage.email || 'support@garagesaas.com',
    data.garage.address || 'Industrial Auto Complex',
  ].join('   |   ');
  doc.text(garageContacts, margin, 32);

  // Document Type & Number Badge (Top Right)
  const rightX = pageWidth - margin;
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(rightX - 56, 11, 56, 12, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(data.documentType, rightX - 28, 18.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`DOC #${data.documentNumber}`, rightX, 31, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 195);
  doc.text(`Billing Date: ${data.date}`, rightX, 37, { align: 'right' });

  let currentY = 54;

  // 2. Billing Cards: Billed To (Left) & Payment / Schedule Terms (Right)
  const cardW = (pageWidth - margin * 2 - 8) / 2;
  const infoCardH = 34;

  // Card helper
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

  // Customer Card
  drawCard(margin, currentY, cardW, infoCardH, 'Billed To (Customer Details)');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(data.customer.name || 'Walk-in Customer', margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${data.customer.phone || 'N/A'}`, margin + 4, currentY + 18);
  doc.text(`Email: ${data.customer.email || 'customer@garagesaas.com'}`, margin + 4, currentY + 23);
  doc.text(`Address: ${data.customer.address || 'Local Region'}`, margin + 4, currentY + 28);

  // Meta / Payment Card
  const rightCardX = margin + cardW + 8;
  drawCard(rightCardX, currentY, cardW, infoCardH, 'Document Metadata & Terms');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Payment Mode:`, rightCardX + 4, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(data.paymentMode || 'UPI / Cashless', rightCardX + 32, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Due Date:`, rightCardX + 4, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(data.dueDate || data.date, rightCardX + 32, currentY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`GSTIN Registration:`, rightCardX + 4, currentY + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(data.garage.gstNumber || '24AABCM1234F1Z5', rightCardX + 32, currentY + 25);

  currentY += infoCardH + 8;

  // 3. Itemized Services & Parts Table
  const tableData = data.items.map((item, idx) => [
    `#0${idx + 1}`,
    item.description,
    item.quantity.toString(),
    `Rs. ${item.unitPrice.toLocaleString('en-IN')}`,
    `Rs. ${item.total.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Item', 'Service / Part Description', 'Qty', 'Unit Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: SLATE_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 98 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Financial Calculations Ledger (Right-Aligned) + Terms (Left-Aligned)
  const summaryBoxW = 76;
  const summaryBoxX = pageWidth - margin - summaryBoxW;

  // Terms and Notes box (Left)
  const termsBoxW = pageWidth - margin * 2 - summaryBoxW - 8;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, finalY, termsBoxW, 46, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);
  doc.text('TERMS & WARRANTY CONDITIONS:', margin + 4, finalY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  const termsLines = [
    '1. 30 Days / 1,000 km workmanship guarantee on all serviced mechanical items.',
    '2. Replaced parts warranty backed by respective genuine OEM manufacturers.',
    '3. Estimates remain valid for 15 days from the date of issue.',
    '4. Payments due upon completion of physical road test and handover.',
  ];
  let termY = finalY + 14;
  termsLines.forEach((t) => {
    doc.text(t, margin + 4, termY);
    termY += 5;
  });

  // Summary Ledger Table (Right)
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(summaryBoxX, finalY, summaryBoxW, 46, 2, 2, 'FD');

  const addLedgerRow = (lbl: string, val: string, y: number, isBold = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 8);
    doc.setTextColor(isAccent ? PRIMARY_COLOR[0] : 75, isAccent ? PRIMARY_COLOR[1] : 85, isAccent ? PRIMARY_COLOR[2] : 99);
    doc.text(lbl, summaryBoxX + 4, y);
    doc.text(val, summaryBoxX + summaryBoxW - 4, y, { align: 'right' });
  };

  addLedgerRow('Subtotal:', `Rs. ${(data.subtotal || 0).toLocaleString('en-IN')}`, finalY + 8);
  addLedgerRow('Tax (GST / VAT):', `Rs. ${(data.tax || 0).toLocaleString('en-IN')}`, finalY + 15);
  
  doc.setDrawColor(209, 213, 219);
  doc.line(summaryBoxX + 4, finalY + 19, summaryBoxX + summaryBoxW - 4, finalY + 19);

  addLedgerRow('Total Payable:', `Rs. ${(data.total || 0).toLocaleString('en-IN')}`, finalY + 25, true, true);
  addLedgerRow('Amount Received:', `Rs. ${(data.paid || 0).toLocaleString('en-IN')}`, finalY + 32, false);

  const bal = data.balance ?? (data.total - (data.paid || 0));
  doc.setFillColor(bal > 0 ? 254 : 240, bal > 0 ? 242 : 253, bal > 0 ? 242 : 244);
  doc.roundedRect(summaryBoxX + 3, finalY + 36, summaryBoxW - 6, 8, 1, 1, 'F');
  addLedgerRow('Balance Remaining:', `Rs. ${bal.toLocaleString('en-IN')}`, finalY + 41.5, true, bal > 0);

  // 5. Signature and Certification Footer
  const signY = finalY + 54;
  doc.setDrawColor(209, 213, 219);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(rightX - 54, signY + 12, rightX, signY + 12);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Authorized Workshop Signatory', rightX - 27, signY + 17, { align: 'center' });

  // System Footer bar
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    'Digitally verified invoice generated by MotoBan Platform · Powered by Hybrid StudioZ',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}
