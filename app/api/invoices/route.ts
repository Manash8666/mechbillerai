import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
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
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
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
    const filters: any = { userId };
    
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
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const body = await request.json();
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
    } = body;

    // Check SaaS Trial Quotas (Max 2 Bills, 2 Estimates per day during 15-day trial)
    const { checkTrialQuota } = await import('@/lib/licensing');
    const isDocEstimate = Boolean(isEstimate || docType === 'ESTIMATE' || body.type === 'ESTIMATE');
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

    // Validate required fields
    const validationError = validateRequired(body, ['customerId', 'items', 'total']);
    if (validationError) {
      return NextResponse.json(
        buildErrorResponse(validationError, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        buildErrorResponse('Invoice must have at least one item', 'INVALID_ITEMS'),
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.description || !item.quantity || !item.unitPrice || item.total === undefined) {
        return NextResponse.json(
          buildErrorResponse('Each item must have description, quantity, unitPrice, and total', 'INVALID_ITEM'),
          { status: 400 }
        );
      }
    }

    // Verify customer exists and belongs to this user
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId },
    });

    if (!customer) {
      return NextResponse.json(
        buildErrorResponse('Customer not found or unauthorized', 'CUSTOMER_NOT_FOUND'),
        { status: 404 }
      );
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

    // Generate invoice or estimate number
    const { generateEstimateNumber } = await import('@/lib/utils');
    const invoiceNumber = isDocEstimate ? generateEstimateNumber() : generateInvoiceNumber();

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        jobCardId,
        subtotal: subtotal || 0,
        tax: tax || 0,
        discount: discount || 0,
        total,
        paid: 0,
        balance: total,
        status: 'unpaid',
        paymentMode: paymentMode || 'cash',
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            details: item.details || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax || 0,
            total: item.total,
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
    });

    return NextResponse.json(invoice, { status: 201 });
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
