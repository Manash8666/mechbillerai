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
  // Standard dimensions: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;

  // 1. Canary Yellow Background
  doc.setFillColor(252, 248, 143);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Large Bold Header: "VEHICLE JOB CARD"
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('VEHICLE JOB CARD', margin, 18);

  if (data.garageName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(data.garageName.toUpperCase(), pageWidth - margin, 14, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.garagePhone || '', pageWidth - margin, 19, { align: 'right' });
  }

  // Top dividing rule
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.8);
  doc.line(margin, 22, pageWidth - margin, 22);

  let currentY = 25;

  // Helper for drawing input boxes
  const drawFieldBox = (
    label: string,
    value: string,
    x: number,
    y: number,
    w: number,
    h = 8
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    doc.text(label, x, y + 3.5);

    // Box with slight tint
    doc.setFillColor(254, 251, 180);
    doc.setDrawColor(180, 175, 90);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y + 4.5, w, h, 0.8, 0.8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    const textToShow = doc.splitTextToSize(value || '', w - 3);
    doc.text(textToShow[0] || '', x + 2, y + 9.5);
  };

  // Row 1: Job No | Job Date | Car Reg No | Year | Mileage
  const colW1 = 44;
  const colW2 = 44;
  const colW3 = 54;
  const colW4 = 20;
  const colW5 = 24;

  const dateStr = data.jobDate || new Date(data.createdAt).toLocaleDateString('en-GB');

  drawFieldBox('Job No.', data.jobNumber, margin, currentY, colW1);
  drawFieldBox('Job Date', dateStr, margin + colW1 + 2, currentY, colW2);
  drawFieldBox('Car Registration No.', data.vehicle.registrationNo, margin + colW1 + colW2 + 4, currentY, colW3);
  drawFieldBox('Year', data.vehicle.year ? String(data.vehicle.year) : '-', margin + colW1 + colW2 + colW3 + 6, currentY, colW4);
  drawFieldBox('Mileage', data.vehicle.mileage ? `${data.vehicle.mileage} km` : '-', margin + colW1 + colW2 + colW3 + colW4 + 8, currentY, colW5);

  currentY += 16;

  // Row 2: Date/Time In | Date/Time Out | Car Make | Car Model
  const colRow2W1 = 44;
  const colRow2W2 = 44;
  const colRow2W3 = 48;
  const colRow2W4 = 50;

  drawFieldBox('Date/Time In', dateStr, margin, currentY, colRow2W1);
  drawFieldBox('Date/Time Out', 'Pending', margin + colRow2W1 + 2, currentY, colRow2W2);
  drawFieldBox('Car Make', data.vehicle.make || '-', margin + colRow2W1 + colRow2W2 + 4, currentY, colRow2W3);
  drawFieldBox('Car Model', data.vehicle.model || '-', margin + colRow2W1 + colRow2W2 + colRow2W3 + 6, currentY, colRow2W4);

  currentY += 16;

  // Row 3: Customer Name | Contact No | Engine No | VIN No
  drawFieldBox('Customer Name', data.customer.name, margin, currentY, colRow2W1);
  drawFieldBox('Customer Contact No.', data.customer.phone, margin + colRow2W1 + 2, currentY, colRow2W2);
  drawFieldBox('Engine / Motor No.', '-', margin + colRow2W1 + colRow2W2 + 4, currentY, colRow2W3);
  drawFieldBox('VIN No.', data.vehicle.vin || '-', margin + colRow2W1 + colRow2W2 + colRow2W3 + 6, currentY, colRow2W4);

  currentY += 18;

  // Middle Section: Left (Defect & Actions) vs Right (Car Diagram Inspection)
  const midLeftW = 95;
  const midRightW = 91;
  const midRightX = margin + midLeftW + 4;

  // Reported Defect
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Reported Defect', margin, currentY + 3);

  doc.setFillColor(254, 251, 180);
  doc.setDrawColor(180, 175, 90);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY + 4, midLeftW, 26, 1, 1, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  const defectText = doc.splitTextToSize(data.description || 'General inspection and scheduled maintenance.', midLeftW - 4);
  doc.text(defectText, margin + 2.5, currentY + 9);

  // Completed Action
  const actionY = currentY + 33;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Completed Action / Tasks', margin, actionY + 3);

  doc.setFillColor(254, 251, 180);
  doc.setDrawColor(180, 175, 90);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, actionY + 4, midLeftW, 30, 1, 1, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let taskY = actionY + 9;
  if (data.tasks && data.tasks.length > 0) {
    data.tasks.slice(0, 5).forEach((t) => {
      const check = t.completed ? '[x]' : '[ ]';
      doc.text(`${check} ${t.description.slice(0, 48)}`, margin + 2.5, taskY);
      taskY += 4.5;
    });
  } else {
    doc.text('Primary diagnostics and vehicle multipoint safety audit executed.', margin + 2.5, taskY);
  }

  // Right Side: Vehicle Body Report (4-way outline)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Vehicle Body Report (Mark with X where damage)', midRightX, currentY + 3);

  doc.setFillColor(254, 251, 180);
  doc.setDrawColor(180, 175, 90);
  doc.setLineWidth(0.2);
  doc.roundedRect(midRightX, currentY + 4, midRightW, 42, 1, 1, 'FD');

  // Vectorized 4-view vehicle diagram
  const diagCenterX = midRightX + midRightW / 2;
  const diagCenterY = currentY + 23;

  doc.setDrawColor(60, 60, 50);
  doc.setLineWidth(0.4);

  // Top view center chassis
  doc.roundedRect(diagCenterX - 18, diagCenterY - 8, 36, 16, 3, 3, 'S');
  doc.line(diagCenterX - 10, diagCenterY - 8, diagCenterX - 10, diagCenterY + 8); // windshield
  doc.line(diagCenterX + 10, diagCenterY - 8, diagCenterX + 10, diagCenterY + 8); // rear window
  // Left profile top
  doc.roundedRect(diagCenterX - 16, diagCenterY - 16, 32, 6, 1.5, 1.5, 'S');
  // Right profile bottom
  doc.roundedRect(diagCenterX - 16, diagCenterY + 10, 32, 6, 1.5, 1.5, 'S');

  // Diagram orientation labels
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 80);
  doc.text('FRONT', diagCenterX + 22, diagCenterY + 1);
  doc.text('REAR', diagCenterX - 27, diagCenterY + 1);
  doc.text('LEFT', diagCenterX - 4, diagCenterY - 17);
  doc.text('RIGHT', diagCenterX - 4, diagCenterY + 18);

  // Vehicle Body Report Comments
  const commentsY = currentY + 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Vehicle Body Report Comments', midRightX, commentsY);

  doc.setFillColor(254, 251, 180);
  doc.roundedRect(midRightX, commentsY + 1.5, midRightW, 17.5, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  if (data.preInspectionShield) {
    doc.text(`Pre-inspection Shield logged: ${data.preInspectionShield.slice(0, 45)}`, midRightX + 2, commentsY + 6);
  } else {
    doc.text('No critical body dent/scratch recorded on arrival.', midRightX + 2, commentsY + 6);
  }

  // Parts & Labor Table Section
  currentY = actionY + 38;

  const tableHeaders = ['Part No.', 'Part Description', 'Qty', 'Unit Price', 'Line Total', 'Labour'];

  const tableRows: (string | number)[][] = [];

  if (data.tasks && data.tasks.length > 0) {
    data.tasks.slice(0, 5).forEach((t, i) => {
      tableRows.push([
        `P-00${i + 1}`,
        t.description,
        1,
        '₹0.00',
        '₹0.00',
        `₹${(data.actualCost || data.estimatedCost || 500) / (data.tasks?.length || 1)}`,
      ]);
    });
  } else {
    tableRows.push([
      'SRV-01',
      data.description || 'Full Vehicle Service & Checkup',
      '1',
      `₹${data.actualCost || data.estimatedCost || 800}`,
      `₹${data.actualCost || data.estimatedCost || 800}`,
      'Included',
    ]);
  }

  // Ensure 5 rows visually
  while (tableRows.length < 5) {
    tableRows.push(['', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [tableHeaders],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [245, 240, 110],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [180, 175, 90],
    },
    bodyStyles: {
      fillColor: [254, 251, 180],
      textColor: [20, 20, 20],
      fontSize: 7.5,
      lineWidth: 0.15,
      lineColor: [190, 185, 100],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 84 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
    },
  });

  // Calculate table end Y
  const finalY = (doc as any).lastAutoTable.finalY || currentY + 45;

  // Bottom Signature & Totals Box
  const bottomBoxY = finalY + 4;
  const sigW = 44;

  drawFieldBox('Technician Name', 'Master Mechanic', margin, bottomBoxY, sigW);
  drawFieldBox('Technician Signature', '✓ Verified', margin + sigW + 4, bottomBoxY, sigW);
  drawFieldBox('Date', dateStr, margin + (sigW * 2) + 8, bottomBoxY, 28);

  // Totals summary at bottom right
  const totalBoxX = margin + 130;
  const totalBoxW = 60;

  const totalAmount = data.actualCost || data.estimatedCost || 0;
  const subTotal = (totalAmount * 0.82).toFixed(2);
  const tax = (totalAmount * 0.18).toFixed(2);

  const drawTotalLine = (label: string, value: string, yPos: number, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.text(label, totalBoxX, yPos);
    doc.text(value, pageWidth - margin, yPos, { align: 'right' });
  };

  doc.setFillColor(254, 251, 180);
  doc.setDrawColor(180, 175, 90);
  doc.rect(totalBoxX - 2, bottomBoxY + 3, totalBoxW + 2, 22, 'FD');

  drawTotalLine('Sub Total', `₹${subTotal}`, bottomBoxY + 8);
  drawTotalLine('GST / Tax (18%)', `₹${tax}`, bottomBoxY + 14);
  doc.setLineWidth(0.3);
  doc.line(totalBoxX, bottomBoxY + 16, pageWidth - margin, bottomBoxY + 16);
  drawTotalLine('TOTAL', `₹${totalAmount.toLocaleString('en-IN')}`, bottomBoxY + 21, true);

  // Disclaimer & Copyright watermark in bottom margin
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 50);
  doc.text('This is not an invoice, all estimates are valid for 30 days', margin, pageHeight - 8);

  // Vertical brand stamp along the right border as seen in the reference image
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(110, 110, 80);
  doc.text('POWERED BY MECHBILLERAI © HYBRID STUDIOZ', pageWidth - 3, pageHeight - 12, { angle: 90 });

  return doc;
}
