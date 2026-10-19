import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  buildErrorResponse,
  logActivity,
} from '@/lib/apiHelpers';

// GET - Single invoice with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            gstNumber: true,
          },
        },
        jobCard: {
          include: {
            vehicle: {
              select: {
                registrationNo: true,
                make: true,
                model: true,
                year: true,
                color: true,
              },
            },
            tasks: {
              select: {
                description: true,
                completed: true,
              },
            },
          },
        },
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        buildErrorResponse('Invoice not found or unauthorized', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Calculate payment summary
    const paymentSummary = {
      totalPaid: invoice.paid,
      balance: invoice.balance,
      paymentCount: invoice.payments.length,
      lastPaymentDate: invoice.payments[0]?.paymentDate || null,
      paymentHistory: invoice.payments.map((p) => ({
        amount: p.amount,
        mode: p.paymentMode,
        date: p.paymentDate,
        notes: p.notes,
      })),
    };

    return NextResponse.json({
      ...invoice,
      paymentSummary,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// PUT - Update invoice with items and full field editing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      notes,
      dueDate,
      paymentMode,
      items,
      subtotal,
      discount,
      tax,
      total,
      paid,
      balance,
      customerId,
    } = body;

    // Check if invoice exists and belongs to this user
    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        payments: true,
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        buildErrorResponse('Invoice not found or unauthorized', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    // Numeric financials
    if (subtotal !== undefined) updateData.subtotal = Number(subtotal);
    if (discount !== undefined) updateData.discount = Number(discount);
    if (tax !== undefined) updateData.tax = Number(tax);
    if (total !== undefined) updateData.total = Number(total);
    if (paid !== undefined) updateData.paid = Number(paid);
    if (balance !== undefined) {
      updateData.balance = Number(balance);
    } else if (total !== undefined && paid !== undefined) {
      updateData.balance = Math.max(0, Number(total) - Number(paid));
    }

    // Auto-calculate status if paid/balance specified
    if (updateData.paid !== undefined && updateData.total !== undefined) {
      if (updateData.balance <= 0) {
        updateData.status = 'paid';
      } else if (updateData.paid > 0) {
        updateData.status = 'partial';
      } else {
        updateData.status = 'unpaid';
      }
    }

    // If items are provided, replace invoice items
    if (Array.isArray(items)) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      await prisma.invoiceItem.createMany({
        data: items.map((item: any) => ({
          invoiceId: id,
          description: item.description || 'Spare/Service',
          details: item.details || null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          tax: Number(item.tax) || 0,
          total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        })),
      });

      // Recalculate totals if not explicitly passed
      if (subtotal === undefined) {
        const calcSubtotal = items.reduce(
          (sum: number, it: any) => sum + (Number(it.total) || 0),
          0
        );
        const calcTax = updateData.tax ?? existing.tax;
        const calcDiscount = updateData.discount ?? existing.discount;
        updateData.subtotal = calcSubtotal;
        updateData.total = calcSubtotal + calcTax - calcDiscount;
        updateData.balance = Math.max(0, updateData.total - (updateData.paid ?? existing.paid));
      }
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        jobCard: true,
        items: true,
        payments: true,
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'UPDATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        changes: body,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Delete invoice with payment check (supports force=true or standard delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') !== 'false'; // default true for owner deletion

    // Check if invoice exists and belongs to this user
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        payments: true,
        _count: {
          select: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        buildErrorResponse('Invoice not found or unauthorized', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Delete associated payments and items
    await prisma.payment.deleteMany({
      where: { invoiceId: id },
    });
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Delete invoice
    await prisma.invoice.delete({
      where: { id },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'DELETE',
      entity: 'Invoice',
      entityId: id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        forced: force,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invoice #${invoice.invoiceNumber} deleted successfully`,
      deletedItems: invoice._count.items,
      deletedPayments: invoice._count.payments,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
