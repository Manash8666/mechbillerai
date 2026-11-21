import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// Add payment to invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(request);
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMode, notes, paymentDate } = body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Get current invoice verifying ownership
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (session && session.userId !== invoice.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this invoice' },
        { status: 403 }
      );
    }

    const effectiveDate = paymentDate ? new Date(paymentDate) : new Date();

    // 1. Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: parsedAmount,
        paymentMode: paymentMode || 'UPI',
        notes: notes || undefined,
        createdAt: effectiveDate,
      },
    });

    // 2. Update invoice balance and status
    const newPaid = Number(invoice.paid || 0) + parsedAmount;
    const newBalance = Math.max(0, Number(invoice.total || 0) - newPaid);
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paid: newPaid,
        balance: newBalance,
        status: newStatus,
        paymentMode: paymentMode || invoice.paymentMode,
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    // 3. Automatically record entry in Daily Ledger so P&L and Balance Sheet update live
    try {
      await prisma.ledgerEntry.create({
        data: {
          userId: invoice.userId,
          type: 'INCOME',
          category: 'Direct Service',
          paymentMode: (paymentMode || 'UPI').toLowerCase(),
          amount: parsedAmount,
          description: `Payment received for Invoice #${invoice.invoiceNumber} (${invoice.customer?.name || 'Customer'})${notes ? ` - ${notes}` : ''}`,
          reference: invoice.invoiceNumber,
          date: effectiveDate,
        },
      });
    } catch (ledgerErr) {
      console.warn('Daily ledger entry skipped during invoice payment recording:', ledgerErr);
    }

    return NextResponse.json({
      success: true,
      payment,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error processing payment' },
      { status: 500 }
    );
  }
}
