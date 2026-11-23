import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { getTargetUserIds } from '@/lib/partnerAccounts';
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
    const { searchParams } = new URL(request.url);
    const authUser = await getSessionUser(request);
    const requestedUserId = authUser?.userId || searchParams.get('userId');

    const { id } = await params;
    let targetUserIds: string[] = [];
    if (requestedUserId) {
      targetUserIds = await getTargetUserIds(requestedUserId);
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        ...(targetUserIds.length > 0 ? { userId: { in: targetUserIds } } : {}),
      },
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
    const { id } = await params;
    const authUser = await getSessionUser(request);
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const userId = authUser?.userId || body.userId || url.searchParams.get('userId');

    let targetUserIds: string[] = [];
    if (userId) {
      targetUserIds = await getTargetUserIds(userId);
    }

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
      deliveryPhoto,
      vehicleModel,
      vehicleReg,
      serviceScope,
    } = body;

    // Check if invoice exists
    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        ...(targetUserIds.length > 0 ? { userId: { in: targetUserIds } } : {}),
      },
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
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    // Merge notes with vehicle and delivery photo
    let existingNotesObj: any = {};
    try {
      if (existing.notes && existing.notes.startsWith('{')) {
        existingNotesObj = JSON.parse(existing.notes);
      }
    } catch {}

    const updatedNotesObj = {
      ...existingNotesObj,
      ...(typeof notes === 'object' && notes !== null ? notes : {}),
      ...(typeof notes === 'string' && notes ? { userNotes: notes } : {}),
      ...(deliveryPhoto ? { deliveryPhoto } : {}),
      ...(vehicleModel ? { vehicleModel } : {}),
      ...(vehicleReg ? { vehicleReg } : {}),
      ...(serviceScope ? { serviceScope } : {}),
    };
    updateData.notes = JSON.stringify(updatedNotesObj);

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
          details: item.details || (item.discount ? `Discount: ${item.discountType === 'percent' ? item.discount + '%' : '₹' + item.discount}` : null),
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

    // Update customer name & phone if provided
    if (existing.customerId && (body.customerName || body.customerPhone || body.customerEmail !== undefined)) {
      const custData: any = {};
      if (body.customerName?.trim()) custData.name = body.customerName.trim();
      if (body.customerPhone?.trim()) custData.phone = body.customerPhone.trim();
      if (body.customerEmail !== undefined) custData.email = body.customerEmail?.trim() || null;
      try {
        await prisma.customer.update({
          where: { id: existing.customerId },
          data: custData,
        });
      } catch (custErr) {
        console.warn('Customer update warning:', custErr);
      }
    }

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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const authUser = await getSessionUser(request);
    const requestedUserId = authUser?.userId || searchParams.get('userId');
    const force = searchParams.get('force') !== 'false'; // default true for owner deletion

    let targetUserIds: string[] = [];
    if (requestedUserId) {
      targetUserIds = await getTargetUserIds(requestedUserId);
    }

    // Check if invoice exists and belongs to this workshop
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        ...(targetUserIds.length > 0 ? { userId: { in: targetUserIds } } : {}),
      },
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
      userId: requestedUserId || invoice.userId,
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
