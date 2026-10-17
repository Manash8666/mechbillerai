import { Share, Alert, Clipboard } from 'react-native';

export interface ThermalLineItem {
  description: string;
  qty?: number;
  rate?: number;
  amount: number;
}

export interface ThermalReceiptData {
  workshopName: string;
  tagline?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  vehicleNumber?: string;
  rtoOffice?: string;
  items: ThermalLineItem[];
  subtotal: number;
  cgst?: number;
  sgst?: number;
  discount?: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode?: string;
  upiVpa?: string;
  footerNote?: string;
}

export type ThermalPaperWidth = '58mm' | '80mm';

/**
 * Pads left and right text to fit exact column width
 */
function justify(left: string, right: string, width: number): string {
  const spaceAvailable = width - left.length - right.length;
  if (spaceAvailable <= 0) {
    return left.slice(0, width - right.length - 1) + ' ' + right;
  }
  return left + ' '.repeat(spaceAvailable) + right;
}

/**
 * Centers text within exact column width
 */
function center(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPadding = Math.floor((width - text.length) / 2);
  const rightPadding = width - text.length - leftPadding;
  return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
}

/**
 * Generates formatted Monospace Thermal Receipt Text (58mm = 32 cols, 80mm = 48 cols)
 */
export function formatThermalReceipt(
  data: ThermalReceiptData,
  paperWidth: ThermalPaperWidth = '58mm'
): string {
  const W = paperWidth === '80mm' ? 48 : 32;
  const divider = '='.repeat(W);
  const thinDivider = '-'.repeat(W);

  const lines: string[] = [];

  // Header
  lines.push(divider);
  lines.push(center(data.workshopName.toUpperCase(), W));
  if (data.tagline) lines.push(center(data.tagline, W));
  if (data.phone) lines.push(center(`Ph: ${data.phone}`, W));
  if (data.address) lines.push(center(data.address, W));
  if (data.gstin) lines.push(center(`GSTIN: ${data.gstin}`, W));
  lines.push(divider);

  // Metadata
  lines.push(justify('Invoice:', `#${data.invoiceNumber}`, W));
  lines.push(justify('Date:', data.date, W));
  lines.push(justify('Customer:', data.customerName.slice(0, W - 10), W));
  if (data.customerPhone) {
    lines.push(justify('Phone:', data.customerPhone, W));
  }
  if (data.vehicleNumber) {
    lines.push(justify('Vehicle:', data.vehicleNumber, W));
  }
  if (data.rtoOffice) {
    lines.push(justify('RTO:', data.rtoOffice.slice(0, W - 5), W));
  }

  // Items table header
  lines.push(thinDivider);
  lines.push(justify('ITEM DESCRIPTION', 'AMOUNT', W));
  lines.push(thinDivider);

  // Items
  for (const item of data.items) {
    const amtStr = `₹${item.amount.toFixed(2)}`;
    let desc = item.description;
    if (item.qty && item.qty > 1 && item.rate) {
      desc = `${item.description} (${item.qty}x${item.rate})`;
    }

    if (desc.length + amtStr.length + 1 <= W) {
      lines.push(justify(desc, amtStr, W));
    } else {
      // Split description across multiple lines
      lines.push(desc.slice(0, W));
      lines.push(justify('', amtStr, W));
    }
  }

  // Summary
  lines.push(thinDivider);
  lines.push(justify('Subtotal:', `₹${data.subtotal.toFixed(2)}`, W));

  if (data.cgst && data.cgst > 0) {
    lines.push(justify('CGST (9%):', `₹${data.cgst.toFixed(2)}`, W));
  }
  if (data.sgst && data.sgst > 0) {
    lines.push(justify('SGST (9%):', `₹${data.sgst.toFixed(2)}`, W));
  }
  if (data.discount && data.discount > 0) {
    lines.push(justify('Discount:', `-₹${data.discount.toFixed(2)}`, W));
  }

  lines.push(divider);
  lines.push(justify('GRAND TOTAL:', `₹${data.total.toFixed(2)}`, W));
  lines.push(justify('Amount Paid:', `₹${data.paid.toFixed(2)}`, W));

  const balanceText = data.balance <= 0 ? 'PAID IN FULL' : `₹${data.balance.toFixed(2)}`;
  lines.push(justify('Balance Due:', balanceText, W));
  lines.push(divider);

  // UPI / Payment Mode Info
  if (data.paymentMode) {
    lines.push(justify('Payment Mode:', data.paymentMode, W));
  }
  if (data.balance > 0 && data.upiVpa) {
    lines.push(center('PAY ONLINE VIA UPI:', W));
    lines.push(center(data.upiVpa, W));
    lines.push(thinDivider);
  }

  // Footer Note
  lines.push(center(data.footerNote || 'Thank You for Trusting Us!', W));
  lines.push(center('Smart Garage Powered by MotoBan', W));
  lines.push(divider);
  lines.push('\n\n\n'); // Paper feed margin

  return lines.join('\n');
}

/**
 * Builds Raw ESC/POS Binary Byte Sequence (for standard Bluetooth SPP thermal printers)
 */
export function buildEscPosBytes(
  data: ThermalReceiptData,
  paperWidth: ThermalPaperWidth = '58mm'
): Uint8Array {
  const receiptText = formatThermalReceipt(data, paperWidth);

  // Standard ESC/POS Control Sequences
  const ESC = 0x1b;
  const GS = 0x1d;

  const initPrinter = [ESC, 0x40]; // ESC @
  const selectFont = [ESC, 0x4d, 0x00]; // Font A (12x24)
  const feedPaper = [ESC, 0x64, 0x04]; // Feed 4 lines
  const cutPaper = [GS, 0x56, 0x42, 0x00]; // Partial cut

  const textBytes = Array.from(new TextEncoder().encode(receiptText));

  const allBytes = [
    ...initPrinter,
    ...selectFont,
    ...textBytes,
    ...feedPaper,
    ...cutPaper,
  ];

  return new Uint8Array(allBytes);
}

/**
 * Native Thermal Printing Intent Dispatcher
 * 100% Free - Sends receipt directly to Bluetooth Thermal Printer apps
 * (RawBT, ESC POS Bluetooth Print, Quick Printer, or Android System Print Spooler)
 */
export async function printOrShareReceipt(
  data: ThermalReceiptData,
  paperWidth: ThermalPaperWidth = '58mm'
): Promise<void> {
  const receiptText = formatThermalReceipt(data, paperWidth);

  try {
    await Share.share({
      title: `${data.workshopName} Receipt #${data.invoiceNumber}`,
      message: receiptText,
    });
  } catch (err: any) {
    // Fallback: Copy to clipboard
    Clipboard.setString(receiptText);
    Alert.alert(
      'Receipt Copied',
      'The formatted thermal receipt text has been copied to your clipboard. You can paste it into any Bluetooth printer app (RawBT / POS-Print).'
    );
  }
}
