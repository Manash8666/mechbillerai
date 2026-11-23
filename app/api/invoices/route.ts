import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import { getTargetUserIds } from '@/lib/partnerAccounts';
import {
  buildAdvancedQuery,
  buildPaginatedResponse,
  buildErrorResponse,
  validateRequired,
  buildDateRangeFilter,
  logActivity,
} from '@/lib/apiHelpers';

// GET - List invoices with advanced filtering, pagination, search, sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { getSessionUser } = await import('@/lib/auth');
    const authUser = await getSessionUser(request);
    const requestedUserId = authUser?.userId || searchParams.get('userId');

    if (!requestedUserId) {
      return NextResponse.json(
        buildErrorResponse('Authentication required. Please sign in.', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Partner Account Aggregation for MotoFit Garages (cached in-memory for high performance)
    const targetUserIds = await getTargetUserIds(requestedUserId);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Advanced filters
    const status = searchParams.get('status'); // paid, partial, unpaid, overdue
    const paymentMode = searchParams.get('paymentMode');
    const customerId = searchParams.get('customerId');
    const amountFrom = searchParams.get('amountFrom');
    const amountTo = searchParams.get('amountTo');
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');
    const dueFrom = searchParams.get('dueFrom');
    const dueTo = searchParams.get('dueTo');

    // Build filters
    const filters: any = {
      userId: targetUserIds.length > 1 ? { in: targetUserIds } : requestedUserId,
    };
    
    if (status) {
      filters.status = status;
    }
    
    if (paymentMode) {
      filters.paymentMode = paymentMode;
    }
    
    if (customerId) {
      filters.customerId = customerId;
    }

    if (amountFrom || amountTo) {
      filters.total = {};
      if (amountFrom) filters.total.gte = parseFloat(amountFrom);
      if (amountTo) filters.total.lte = parseFloat(amountTo);
    }

    // Build query
    const query = buildAdvancedQuery({
      page,
      limit,
      search,
      searchFields: ['invoiceNumber'],
      sortBy,
      sortOrder,
      filters,
    });

    // Add date range filters
    if (createdFrom || createdTo) {
      query.where.createdAt = buildDateRangeFilter(createdFrom, createdTo);
    }

    if (dueFrom || dueTo) {
      query.where.dueDate = buildDateRangeFilter(dueFrom, dueTo);
    }

    // Fetch invoices and total count
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        ...query,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          jobCard: {
            select: {
              id: true,
              jobNumber: true,
              status: true,
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              details: true,
              quantity: true,
              unitPrice: true,
              tax: true,
              total: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMode: true,
              paymentDate: true,
              notes: true,
            },
            orderBy: { paymentDate: 'desc' },
          },
          _count: {
            select: {
              items: true,
              payments: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where: query.where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.invoice.aggregate({
      where: query.where,
      _sum: {
        total: true,
        paid: true,
        balance: true,
      },
      _count: true,
    });

    const { generateInvoiceToken } = await import('@/lib/hmacToken');
    const invoicesWithTokens = invoices.map((inv) => ({
      ...inv,
      secureToken: generateInvoiceToken(inv.invoiceNumber, inv.createdAt),
    }));

    // Build paginated response with summary
    const response = {
      ...buildPaginatedResponse(invoicesWithTokens, total, page, limit),
      summary: {
        totalAmount: summary._sum.total || 0,
        paidAmount: summary._sum.paid || 0,
        pendingAmount: summary._sum.balance || 0,
        invoiceCount: summary._count,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// POST - Create new invoice with validation
export async function POST(request: Request) {
  try {
    const { getSessionUser } = await import('@/lib/auth');
    const authUser = await getSessionUser(request);
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const userId = authUser?.userId || body.userId || url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        buildErrorResponse('Authentication required. User ID missing.', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Partner Account Aggregation for MotoFit Garages (cached in-memory for high performance)
    const targetUserIds = await getTargetUserIds(userId);

    const {
      customerId,
      jobCardId,
      items,
      subtotal,
      tax,
      discount,
      total,
      dueDate,
      paymentMode,
      notes,
      docType,
      isEstimate,
      customerName,
      customerPhone,
      customerEmail,
      vehicleModel,
      vehicleReg,
      serviceScope,
      deliveryPhoto,
    } = body;

    // Check SaaS Trial Quotas (Max 2 Bills, 2 Estimates per day during 15-day trial)
    const { checkTrialQuota } = await import('@/lib/licensing');
    const isDocEstimate = Boolean(isEstimate || docType === 'ESTIMATE' || docType === 'SOW_ESTIMATE' || body.type === 'ESTIMATE');
    const quotaCheck = await checkTrialQuota(userId, isDocEstimate ? 'ESTIMATE' : 'BILL');

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        buildErrorResponse(
          quotaCheck.reason || 'SaaS Trial Quota Reached. Please upgrade to MotoBan Pro.',
          quotaCheck.code || 'QUOTA_EXCEEDED',
          { quota: quotaCheck }
        ),
        { status: 403 }
      );
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        buildErrorResponse('Invoice must have at least one item', 'INVALID_ITEMS'),
        { status: 400 }
      );
    }

    // Resolve or Auto-Create Customer
    let customer: any = null;
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: { id: customerId, userId: { in: targetUserIds } },
      });
    }

    if (!customer) {
      const phoneToMatch = (customerPhone || body.customer?.phone || '').trim();
      const nameToMatch = (customerName || body.customer?.name || 'Walk-in Customer').trim();
      
      if (phoneToMatch) {
        customer = await prisma.customer.findFirst({
          where: { phone: phoneToMatch, userId: { in: targetUserIds } },
        });
      }
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            userId,
            name: nameToMatch,
            phone: phoneToMatch || '',
            email: customerEmail || body.customer?.email || null,
          },
        });
      }
    }

    // Optional Vehicle Linking / Creation
    const regNo = (vehicleReg || body.customer?.vehicleReg || '').trim();
    const vMakeModel = (vehicleModel || body.customer?.vehicleModel || '').trim();
    if (customer && (regNo || vMakeModel)) {
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          customerId: customer.id,
          OR: [
            ...(regNo ? [{ registrationNo: regNo }] : []),
            ...(vMakeModel ? [{ model: vMakeModel }] : []),
          ],
        },
      });

      if (!existingVehicle && regNo) {
        await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            registrationNo: regNo,
            make: vMakeModel.split(' ')[0] || 'Hero',
            model: vMakeModel || 'Motorcycle',
            year: 2022,
          },
        }).catch(() => {});
      }
    }

    // Verify job card exists if provided
    if (jobCardId) {
      const jobCard = await prisma.jobCard.findUnique({
        where: { id: jobCardId },
      });

      if (!jobCard) {
        return NextResponse.json(
          buildErrorResponse('Job card not found', 'JOBCARD_NOT_FOUND'),
          { status: 404 }
        );
      }
    }

    // Financial Calculation
    const totalAmount = Number(total) || 0;
    const paidAmount = body.status === 'paid' || body.markPaidImmediately
      ? totalAmount
      : Math.min(totalAmount, Number(body.paid) || 0);
    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    const invoiceStatus = balanceAmount <= 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');

    // Structured notes with vehicle details, delivery handover photo, and scope
    let finalNotes: string = '';
    if (typeof notes === 'object' && notes !== null) {
      finalNotes = JSON.stringify({
        ...notes,
        vehicleModel: vMakeModel || notes.vehicleModel,
        vehicleReg: regNo || notes.vehicleReg,
        serviceScope: serviceScope || notes.serviceScope,
        deliveryPhoto: deliveryPhoto || notes.deliveryPhoto,
      });
    } else {
      finalNotes = JSON.stringify({
        userNotes: notes || '',
        vehicleModel: vMakeModel || undefined,
        vehicleReg: regNo || undefined,
        serviceScope: serviceScope || undefined,
        deliveryPhoto: deliveryPhoto || undefined,
      });
    }

    // Generate invoice or estimate number
    const { generateEstimateNumber } = await import('@/lib/utils');
    const invoiceNumber = isDocEstimate ? generateEstimateNumber() : generateInvoiceNumber();

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        jobCardId,
        subtotal: Number(subtotal) || 0,
        tax: Number(tax) || 0,
        discount: Number(discount) || 0,
        total: totalAmount,
        paid: paidAmount,
        balance: balanceAmount,
        status: invoiceStatus,
        paymentMode: paymentMode || 'cash',
        notes: finalNotes,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            details: item.details || (item.discount ? `Discount: ${item.discountType === 'percent' ? item.discount + '%' : '₹' + item.discount}` : null),
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            tax: Number(item.tax) || 0,
            total: Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)),
          })),
        },
      },
      include: {
        customer: true,
        jobCard: true,
        items: true,
        payments: true,
      },
    });

    // Record payment if paid amount was collected at generation
    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paidAmount,
          paymentMode: (paymentMode || 'cash').toUpperCase(),
          notes: 'Settled at invoice generation',
        },
      }).catch(() => {});
    }

    // Generate secure token for instant PDF viewing/sharing
    const { generateInvoiceToken } = await import('@/lib/hmacToken');
    const invoiceWithToken = {
      ...invoice,
      secureToken: generateInvoiceToken(invoice.invoiceNumber, invoice.createdAt),
    };

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        customer: customer.name,
        total: invoice.total,
      },
    }).catch(() => {});

    return NextResponse.json(invoiceWithToken, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete invoices
export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      return NextResponse.json(
        buildErrorResponse('No invoice IDs provided', 'MISSING_IDS'),
        { status: 400 }
      );
    }

    // Check if any invoices have payments
    const invoicesWithPayments = await prisma.invoice.findMany({
      where: {
        id: { in: ids },
        userId,
        paid: { gt: 0 },
      },
      select: {
        id: true,
        invoiceNumber: true,
        paid: true,
      },
    });

    if (invoicesWithPayments.length > 0) {
      return NextResponse.json(
        buildErrorResponse(
          'Cannot delete invoices with payments',
          'HAS_PAYMENTS',
          { invoices: invoicesWithPayments }
        ),
        { status: 409 }
      );
    }

    // Delete invoices (cascade will handle items and payments)
    const result = await prisma.invoice.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'BULK_DELETE',
      entity: 'Invoice',
      entityId: 'bulk',
      details: { count: result.count, ids },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} invoice(s)`,
    });
  } catch (error) {
    console.error('Error deleting invoices:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
