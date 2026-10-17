import crypto from 'crypto';

const HMAC_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.SESSION_SECRET ||
  'motoban-production-hmac-integrity-key-32chars';

/**
 * Generates an unguessable 16-character cryptographic HMAC signature for an invoice
 */
export function generateInvoiceToken(invoiceNumber: string, createdAt: Date | string): string {
  const dateStr = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  const payload = `${invoiceNumber}:${dateStr}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex').slice(0, 16);
}

/**
 * Validates the HMAC signature for public bill access
 */
export function verifyInvoiceToken(
  invoiceNumber: string,
  createdAt: Date | string,
  providedToken: string | null | undefined
): boolean {
  if (!providedToken) return false;
  const expectedToken = generateInvoiceToken(invoiceNumber, createdAt);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedToken, 'utf8'),
      Buffer.from(expectedToken, 'utf8')
    );
  } catch {
    return false;
  }
}
