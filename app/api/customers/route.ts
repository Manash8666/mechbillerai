import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  buildAdvancedQuery,
  buildPaginatedResponse,
  buildErrorResponse,
  validateRequired,
  logActivity,
} from '@/lib/apiHelpers';

// GET - List customers with advanced filtering, pagination, search, sorting
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
    const hasVehicles = searchParams.get('hasVehicles');
    const hasGst = searchParams.get('hasGst');
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');

    // Build filters
    const filters: any = { userId };
    
    if (hasVehicles === 'true') {
      filters.vehicles = { some: {} };
    } else if (hasVehicles === 'false') {
      filters.vehicles = { none: {} };
    }

    if (hasGst === 'true') {
      filters.gstNumber = { not: null };
    } else if (hasGst === 'false') {
      filters.gstNumber = null;
    }

    // Build query
    const query = buildAdvancedQuery({
      page,
      limit,
      search,
      searchFields: ['name', 'email', 'phone', 'gstNumber', 'address'],
      sortBy,
      sortOrder,
      filters,
    });

    // Add date range filter if provided
    if (createdFrom || createdTo) {
      const dateFilter: any = {};
      if (createdFrom) dateFilter.gte = new Date(createdFrom);
      if (createdTo) {
        const toDate = new Date(createdTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
      query.where.createdAt = dateFilter;
    }

    // Fetch customers and total count
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        ...query,
        include: {
          vehicles: {
            select: {
              id: true,
              registrationNo: true,
              make: true,
              model: true,
              year: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              jobCards: true,
              invoices: true,
            },
          },
        },
      }),
      prisma.customer.count({ where: query.where }),
    ]);

    // Build paginated response
    const response = buildPaginatedResponse(customers, total, page, limit);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// POST - Create new customer with validation and activity logging
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const body = await request.json();
    const { name, phone, email, address, gstNumber } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'phone']);
    if (validationError) {
      return NextResponse.json(
        buildErrorResponse(validationError, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        buildErrorResponse('Invalid email format', 'INVALID_EMAIL'),
        { status: 400 }
      );
    }

    // Validate phone format (Indian format)
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return NextResponse.json(
        buildErrorResponse('Invalid phone number format', 'INVALID_PHONE'),
        { status: 400 }
      );
    }

    // Check for duplicate phone or email
    const existing = await prisma.customer.findFirst({
      where: {
        userId,
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        buildErrorResponse(
          `Customer with this ${existing.phone === phone ? 'phone' : 'email'} already exists`,
          'DUPLICATE_CUSTOMER'
        ),
        { status: 409 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        gstNumber,
        userId,
      },
      include: {
        vehicles: true,
        _count: {
          select: {
            jobCards: true,
            invoices: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      details: { name: customer.name, phone: customer.phone },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete customers
export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      return NextResponse.json(
        buildErrorResponse('No customer IDs provided', 'MISSING_IDS'),
        { status: 400 }
      );
    }

    // Delete customers
    const result = await prisma.customer.deleteMany({
      where: {
        id: { in: ids },
        userId, // Security: ensure user owns these customers
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'BULK_DELETE',
      entity: 'Customer',
      entityId: 'bulk',
      details: { count: result.count, ids },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} customer(s)`,
    });
  } catch (error) {
    console.error('Error deleting customers:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
