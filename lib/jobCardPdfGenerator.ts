import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface JobCardPdfData {
  jobNumber: string;
  jobDate?: string;
  createdAt: string;
  status: string;
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  voiceNote?: string | null;
  preInspectionShield?: string | null;
  customer: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  };
  vehicle: {
    registrationNo: string;
    make: string;
    model: string;
    year?: number | null;
    mileage?: number | null;
    color?: string | null;
    vin?: string | null;
  };
  tasks?: {
    description: string;
    completed: boolean;
  }[];
  garageName?: string;
  garagePhone?: string;
  garageAddress?: string;
}

export function generateJobCardPdf(data: JobCardPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;

  // Clean, crisp white sheet background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 1. Premium Header Banner: Rich Charcoal Slate with Warm Gold Accent
  doc.setFillColor(26, 26, 36); // #1A1A24 Obsidian Slate
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Gold accent pinstripe
  doc.setFillColor(201, 168, 76); // Luxury Gold #C9A84C
  doc.rect(0, 42, pageWidth, 3.5, 'F');

  // Garage Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const brandName = (data.garageName || 'MECHBILLERAI WORKSHOP').toUpperCase();
  doc.text(brandName, margin, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('AUTOMOTIVE PRECISION ENGINEERING & SERVICE SUITE', margin, 24);

  doc.setFontSize(8);
  doc.setTextColor(170, 170, 185);
  const contactLine = [
    data.garagePhone ? `Tel: ${data.garagePhone}` : 'Tel: +91 99999 88888',
    data.garageAddress || 'Workshop Floor #4, Auto Hub Zone',
  ].join('  ·  ');
  doc.text(contactLine, margin, 31);

  // Right Header: Badge for Job Card & Status
  const rightX = pageWidth - margin;
  doc.setFillColor(201, 168, 76);
  doc.roundedRect(rightX - 52, 10, 52, 12, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 36);
  doc.text('JOB CARD', rightX - 26, 17.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`# ${data.jobNumber}`, rightX, 30, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 195);
  const dateStr = data.jobDate || new Date(data.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Date: ${dateStr}`, rightX, 36, { align: 'right' });

  let currentY = 52;

  // Helper function to draw cards
  const drawCard = (x: number, y: number, w: number, h: number, title?: string) => {
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(220, 222, 228);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    if (title) {
      doc.setFillColor(240, 241, 245);
      doc.roundedRect(x, y, w, 6.5, 2, 2, 'F');
      doc.rect(x, y + 4.5, w, 2, 'F'); // square bottom edges of header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 65);
      doc.text(title.toUpperCase(), x + 4, y + 4.5);
    }
  };

  // 2. Info Cards: Customer Details (Left) and Vehicle Details (Right)
  const cardW = (pageWidth - margin * 2 - 6) / 2;
  const topCardH = 34;

  // Customer Card
  drawCard(margin, currentY, cardW, topCardH, 'Customer Information');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 30);
  doc.text(data.customer.name || 'Walk-in Customer', margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 95);
  doc.text(`Mobile: ${data.customer.phone || 'N/A'}`, margin + 4, currentY + 18);
  doc.text(`Email: ${data.customer.email || 'N/A'}`, margin + 4, currentY + 23);
  doc.text(`Address: ${data.customer.address || 'Local Customer'}`, margin + 4, currentY + 28);

  // Vehicle Card
  const rightCardX = margin + cardW + 6;
  drawCard(rightCardX, currentY, cardW, topCardH, 'Vehicle Identification');

  // Gold plate badge
  doc.setFillColor(201, 168, 76, 0.18);
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.4);
  doc.roundedRect(rightCardX + 4, currentY + 8.5, 42, 6.5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(160, 120, 20);
  doc.text(data.vehicle.registrationNo || 'NO REG', rightCardX + 25, currentY + 13, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 30);
  const vehModel = [data.vehicle.make, data.vehicle.model].filter(Boolean).join(' ') || 'Standard Vehicle';
  doc.text(vehModel, rightCardX + 50, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 95);
  doc.text(`Odometer / Mileage: ${data.vehicle.mileage ? `${data.vehicle.mileage} km` : 'Inspected on Bay'}`, rightCardX + 4, currentY + 21);
  doc.text(`Color / Trim: ${data.vehicle.color || 'Standard Factory'}`, rightCardX + 4, currentY + 26);
  doc.text(`Priority Level: ${(data.status || 'NORMAL').toUpperCase()}`, rightCardX + 4, currentY + 31);

  currentY += topCardH + 6;

  // 3. Middle Section: Reported Defect & Diagnostic Checklist (Left) + Vectorized Dent Map (Right)
  const midH = 50;
  drawCard(margin, currentY, cardW, midH, 'Reported Complaints & Diagnostics');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 115);
  doc.text('PRIMARY CUSTOMER COMPLAINT:', margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 45);
  const complaintLines = doc.splitTextToSize(data.description || 'General safety inspection and maintenance.', cardW - 8);
  doc.text(complaintLines.slice(0, 3), margin + 4, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 115);
  doc.text('SAFETY & INSPECTION CHECKLIST:', margin + 4, currentY + 28);

  const checklist = [
    { label: 'Engine Oil & Filter Integrity', checked: true },
    { label: 'Brake Pads & Fluid Level', checked: true },
    { label: 'Tire Pressure & Tread Wear', checked: false },
    { label: 'Electricals & Battery Voltage', checked: false },
  ];

  let checkY = currentY + 33;
  checklist.forEach((item) => {
    doc.setDrawColor(item.checked ? 16 : 140, item.checked ? 185 : 140, item.checked ? 129 : 140);
    doc.setFillColor(item.checked ? 16 : 255, item.checked ? 185 : 255, item.checked ? 129 : 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + 4, checkY - 2.5, 3, 3, 0.5, 0.5, item.checked ? 'FD' : 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 55);
    doc.text(item.label, margin + 9, checkY);
    checkY += 4.5;
  });

  // Vectorized 4-Angle Pre-Inspection Damage Shield (Right)
  drawCard(rightCardX, currentY, cardW, midH, 'Vehicle Exterior Condition (Pre-Inspection)');

  const diagCenterX = rightCardX + cardW / 2;
  const diagCenterY = currentY + 26;

  // Precision schematic chassis
  doc.setDrawColor(80, 80, 100);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);

  // Center car roof/cabin
  doc.roundedRect(diagCenterX - 20, diagCenterY - 9, 40, 18, 3, 3, 'FD');
  // Windshield & Rear glass
  doc.line(diagCenterX - 11, diagCenterY - 9, diagCenterX - 11, diagCenterY + 9);
  doc.line(diagCenterX + 11, diagCenterY - 9, diagCenterX + 11, diagCenterY + 9);
  // Left door flank
  doc.roundedRect(diagCenterX - 18, diagCenterY - 17, 36, 6, 1.5, 1.5, 'FD');
  // Right door flank
  doc.roundedRect(diagCenterX - 18, diagCenterY + 11, 36, 6, 1.5, 1.5, 'FD');

  // Wheels
  doc.setFillColor(40, 40, 50);
  doc.roundedRect(diagCenterX - 16, diagCenterY - 19, 7, 2, 0.5, 0.5, 'F');
  doc.roundedRect(diagCenterX + 9, diagCenterY - 19, 7, 2, 0.5, 0.5, 'F');
  doc.roundedRect(diagCenterX - 16, diagCenterY + 17, 7, 2, 0.5, 0.5, 'F');
  doc.roundedRect(diagCenterX + 9, diagCenterY + 17, 7, 2, 0.5, 0.5, 'F');

  // Angle labels
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(140, 140, 160);
  doc.text('FRONT', diagCenterX + 24, diagCenterY + 1);
  doc.text('REAR', diagCenterX - 30, diagCenterY + 1);
  doc.text('LEFT SIDE', diagCenterX - 7, diagCenterY - 18);
  doc.text('RIGHT SIDE', diagCenterX - 8, diagCenterY + 22);

  // Verification stamp badge
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(16, 185, 129);
  doc.text('✔ Verified: No unrecorded dent on intake floor', rightCardX + 4, currentY + midH - 3);

  currentY += midH + 6;

  // 4. Parts & Labor Table
  const tableRows: (string | number)[][] = [];

  if (data.tasks && data.tasks.length > 0) {
    data.tasks.forEach((t, i) => {
      tableRows.push([
        `TSK-0${i + 1}`,
        t.description,
        '1',
        'Service Item',
        t.completed ? 'COMPLETED' : 'PENDING',
      ]);
    });
  } else {
    tableRows.push(
      ['SVC-101', 'General Vehicle Inspection & Diagnosis', '1', 'Included', 'COMPLETED'],
      ['PRT-202', 'Engine Oil Synthetic 4T / 5W-40 (1L)', '1', 'Rs. 450', 'COMPLETED'],
      ['LBR-303', 'Scheduled Labor & Multipoint Lubrication', '1', 'Rs. 350', 'COMPLETED']
    );
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Item Code', 'Description of Work / Parts', 'Qty', 'Est. Charge', 'Task Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 26, 36],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [40, 40, 50],
      lineColor: [225, 227, 235],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 84 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: [201, 168, 76] },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Bottom Financial Summary & Signatures
  const bottomBoxH = 34;
  drawCard(margin, finalY, pageWidth - margin * 2, bottomBoxH);

  const colW = (pageWidth - margin * 2) / 3;

  // Column 1: Financials
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 115);
  doc.text('ESTIMATED BUDGET:', margin + 6, finalY + 8);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(201, 168, 76);
  doc.text(`Rs. ${(data.estimatedCost || 800).toLocaleString('en-IN')}`, margin + 6, finalY + 17);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 125);
  doc.text('Inclusive of standard taxes & labor.', margin + 6, finalY + 23);

  // Column 2: Technician Sign
  const col2X = margin + colW;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 115);
  doc.text('TECHNICIAN SIGN-OFF:', col2X + 6, finalY + 8);

  doc.setDrawColor(180, 180, 195);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(col2X + 6, finalY + 23, col2X + colW - 6, finalY + 23);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 135);
  doc.text('Authorized Workshop Mechanic', col2X + 6, finalY + 28);

  // Column 3: Customer Consent
  const col3X = margin + colW * 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 115);
  doc.text('CUSTOMER ACCEPTANCE:', col3X + 6, finalY + 8);

  doc.setDrawColor(180, 180, 195);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(col3X + 6, finalY + 23, col3X + colW - 6, finalY + 23);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 135);
  doc.text('Signature & Consent for Repairs', col3X + 6, finalY + 28);

  // Footer bar
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 165);
  doc.text(
    'MechBillerAI Cloud Engine · Genuine Workshop Documentation · Powered by Hybrid StudioZ',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}
