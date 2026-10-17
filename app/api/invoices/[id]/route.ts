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
      paymentHistory: invoice.payments.map(p => ({
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

// PUT - Update invoice with validation
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
    const { status, notes, dueDate } = body;

    // Check if invoice exists and belongs to this user
    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        payments: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        buildErrorResponse('Invoice not found or unauthorized', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Validate status change
    if (status) {
      // Can't mark as unpaid if there are payments
      if (status === 'unpaid' && existing.paid > 0) {
        return NextResponse.json(
          buildErrorResponse(
            'Cannot mark invoice as unpaid when payments exist',
            'INVALID_STATUS_CHANGE'
          ),
          { status: 400 }
        );
      }

      // Auto-calculate correct status based on payments
      const calculatedStatus = 
        existing.balance === 0 ? 'paid' :
        existing.paid > 0 ? 'partial' :
        'unpaid';

      if (status !== calculatedStatus) {
        return NextResponse.json(
          buildErrorResponse(
            `Invoice status should be '${calculatedStatus}' based on payments`,
            'INCORRECT_STATUS'
          ),
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate) updateData.dueDate = new Date(dueDate);

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

// DELETE - Delete invoice with payment check
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
    const force = searchParams.get('force') === 'true';

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

    // Check if invoice has payments
    if (invoice.paid > 0 && !force) {
      return NextResponse.json(
        buildErrorResponse(
          'Cannot delete invoice with payments. Use force=true to delete anyway.',
          'HAS_PAYMENTS',
          {
            paidAmount: invoice.paid,
            paymentCount: invoice._count.payments,
          }
        ),
        { status: 409 }
      );
    }

    // Delete invoice (cascade will handle items and payments)
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
      message: 'Invoice deleted successfully',
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
