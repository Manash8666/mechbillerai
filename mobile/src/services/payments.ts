import { Linking, Alert } from 'react-native';

export interface MobileUpiParams {
  vpa: string; // Workshop UPI VPA
  payeeName: string;
  amount: number;
  invoiceNumber: string;
  notes?: string;
}

export interface MobileWhatsAppParams {
  phone: string;
  customerName: string;
  vehicleNumber?: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  garageName: string;
  invoiceUrl?: string;
}

/**
 * Builds NPCI UPI Intent URI compatible with all Indian UPI Apps (GPay, PhonePe, Paytm, BHIM)
 * 100% Free - Uses Android system protocol handler
 */
export function buildMobileUpiUri(params: MobileUpiParams): string {
  const { vpa, payeeName, amount, invoiceNumber, notes } = params;
  const tn = notes || `Payment for Bill #${invoiceNumber}`;

  const queryParams = [
    `pa=${encodeURIComponent(vpa)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${amount.toFixed(2)}`,
    `cu=INR`,
    `tr=${encodeURIComponent(invoiceNumber)}`,
    `tn=${encodeURIComponent(tn)}`,
  ].join('&');

  return `upi://pay?${queryParams}`;
}

/**
 * Launches Android UPI App Chooser (GPay / PhonePe / Paytm / BHIM)
 */
export async function launchMobileUpiPayment(params: MobileUpiParams): Promise<boolean> {
  if (!params.vpa || params.vpa.trim() === '') {
    Alert.alert('UPI Not Configured', 'Please configure your Workshop UPI ID in Settings > Branding to receive payments.');
    return false;
  }
  const uri = buildMobileUpiUri(params);
  try {
    const canOpen = await Linking.canOpenURL(uri);
    if (canOpen) {
      await Linking.openURL(uri);
      return true;
    } else {
      Alert.alert(
        'UPI App Not Detected',
        `Please install Google Pay, PhonePe, or Paytm to pay directly.\n\nUPI VPA: ${params.vpa}\nAmount: ₹${params.amount.toFixed(2)}`
      );
      return false;
    }
  } catch (err: any) {
    Alert.alert('Payment Error', err.message || 'Could not launch UPI application.');
    return false;
  }
}

/**
 * Normalizes Indian mobile number to 91XXXXXXXXXX
 */
export function formatIndianPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

/**
 * Launches WhatsApp with prefilled invoice details
 * 100% Free - Uses WhatsApp deep link API
 */
export async function launchWhatsAppBill(params: MobileWhatsAppParams): Promise<void> {
  const cleanPhone = formatIndianPhoneNumber(params.phone);
  if (!cleanPhone) {
    Alert.alert('Missing Phone', 'Customer mobile number is required to send bill on WhatsApp.');
    return;
  }

  const vehicleLine = params.vehicleNumber ? `\n🚗 *Vehicle:* ${params.vehicleNumber}` : '';
  const statusText = params.balanceAmount <= 0 ? '✅ PAID' : '⏳ BALANCE DUE';
  const urlSection = params.invoiceUrl ? `\n\n📄 *View & Download PDF Bill:*\n${params.invoiceUrl}` : '';

  const message =
`*${params.garageName.toUpperCase()}*
_Automotive Workshop & Smart Billing_

Hello *${params.customerName}*, your vehicle service bill is ready:
${vehicleLine}
🧾 *Invoice:* #${params.invoiceNumber}
💰 *Total Bill:* ₹${params.totalAmount.toLocaleString('en-IN')}
💵 *Paid:* ₹${params.paidAmount.toLocaleString('en-IN')}
⚖️ *Status:* ${statusText} ${params.balanceAmount > 0 ? `(₹${params.balanceAmount.toLocaleString('en-IN')})` : ''}
${urlSection}

Thank you for choosing *${params.garageName}*!`;

  const waUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(waUrl);
    if (canOpen) {
      await Linking.openURL(waUrl);
    } else {
      await Linking.openURL(fallbackUrl);
    }
  } catch {
    await Linking.openURL(fallbackUrl);
  }
}
