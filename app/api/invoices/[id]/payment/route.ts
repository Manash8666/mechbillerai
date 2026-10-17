import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Add payment to invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMode, notes } = body;

    if (!amount || !paymentMode) {
      return NextResponse.json(
        { error: 'Amount and payment mode are required' },
        { status: 400 }
      );
    }

    // Get current invoice verifying ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        paymentMode,
        notes,
      },
    });

    // Update invoice
    const newPaid = invoice.paid + amount;
    const newBalance = invoice.total - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newBalance < invoice.total ? 'partial' : 'unpaid';

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paid: newPaid,
        balance: newBalance,
        status: newStatus,
        paymentMode,
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    return NextResponse.json({
      payment,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
