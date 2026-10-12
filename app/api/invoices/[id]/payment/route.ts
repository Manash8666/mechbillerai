import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Add payment to invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMode, notes } = body;

    if (!amount || !paymentMode) {
      return NextResponse.json(
        { error: 'Amount and payment mode are required' },
        { status: 400 }
      );
    }

    // Get current invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
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
