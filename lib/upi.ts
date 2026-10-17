import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  vpa: string; // e.g. 'motoban@icici' or workshop VPA
  payeeName: string; // e.g. 'MotoFit Workshop'
  amount: number;
  invoiceNumber: string;
  notes?: string;
}

/**
 * Builds standard NPCI UPI Intent URI for all Indian UPI apps (GPay, PhonePe, Paytm, BHIM, Cred)
 */
export function buildUpiUri(details: UpiPaymentDetails): string {
  const { vpa, payeeName, amount, invoiceNumber, notes } = details;
  const noteText = notes || `Payment for Invoice #${invoiceNumber}`;
  
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
    tr: invoiceNumber,
    tn: noteText,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates Base64 Data URL QR Code for counter display and PDF inclusion
 */
export async function generateUpiQrDataUrl(details: UpiPaymentDetails): Promise<string> {
  const uri = buildUpiUri(details);
  return await QRCode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#0B0F19', // MotoBan Void Canvas dark
      light: '#FFFFFF',
    },
  });
}
