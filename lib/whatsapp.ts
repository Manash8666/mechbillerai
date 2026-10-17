export interface WhatsAppBillDetails {
  phone: string;
  customerName: string;
  vehicleNumber?: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  garageName: string;
  garagePhone?: string;
  invoiceUrl?: string;
}

/**
 * Normalizes Indian phone number to 12 digits (91XXXXXXXXXX)
 */
export function normalizeIndianPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Generates direct WhatsApp click-to-chat URL with formatted invoice summary
 */
export function buildWhatsAppBillUrl(details: WhatsAppBillDetails): string {
  const cleanPhone = normalizeIndianPhoneNumber(details.phone);
  const vehicleText = details.vehicleNumber ? `\n🚗 *Vehicle:* ${details.vehicleNumber}` : '';
  const statusEmoji = details.balanceAmount <= 0 ? '✅ PAID' : '⏳ BALANCE PENDING';
  const urlSection = details.invoiceUrl ? `\n\n📄 *View & Download PDF Bill:*\n${details.invoiceUrl}` : '';

  const message = 
`*${details.garageName.toUpperCase()}*
_Automotive Service & Repair Invoice_

Hello *${details.customerName}*, your vehicle service bill is ready:
${vehicleText}
🧾 *Invoice:* #${details.invoiceNumber}
💰 *Total Bill:* ₹${details.totalAmount.toLocaleString('en-IN')}
💵 *Paid:* ₹${details.paidAmount.toLocaleString('en-IN')}
⚖️ *Status:* ${statusEmoji} ${details.balanceAmount > 0 ? `(₹${details.balanceAmount.toLocaleString('en-IN')})` : ''}
${urlSection}

Thank you for choosing *${details.garageName}*! For assistance, reach us at ${details.garagePhone || 'our service desk'}.`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
