import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateJobNumber } from '@/lib/utils';
import {
  buildAdvancedQuery,
  buildPaginatedResponse,
  buildErrorResponse,
  validateRequired,
  buildDateRangeFilter,
  logActivity,
} from '@/lib/apiHelpers';

// GET - List job cards with advanced filtering, pagination, search, sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        buildErrorResponse('User ID is required', 'MISSING_USER_ID'),
        { status: 400 }
      );
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Advanced filters
    const status = searchParams.get('status'); // pending, in-progress, completed, cancelled
    const priority = searchParams.get('priority'); // low, normal, high
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');
    const hasInvoice = searchParams.get('hasInvoice');
    const costFrom = searchParams.get('costFrom');
    const costTo = searchParams.get('costTo');
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');
    const completedFrom = searchParams.get('completedFrom');
    const completedTo = searchParams.get('completedTo');

    // Build filters
    const filters: any = { userId };
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (customerId) filters.customerId = customerId;
    if (vehicleId) filters.vehicleId = vehicleId;

    if (hasInvoice === 'true') {
      filters.invoice = { isNot: null };
    } else if (hasInvoice === 'false') {
      filters.invoice = null;
    }

    if (costFrom || costTo) {
      filters.estimatedCost = {};
      if (costFrom) filters.estimatedCost.gte = parseFloat(costFrom);
      if (costTo) filters.estimatedCost.lte = parseFloat(costTo);
    }

    // Build query
    const query = buildAdvancedQuery({
      page,
      limit,
      search,
      searchFields: ['jobNumber', 'description'],
      sortBy,
      sortOrder,
      filters,
    });

    // Add date range filters
    if (createdFrom || createdTo) {
      query.where.createdAt = buildDateRangeFilter(createdFrom, createdTo);
    }

    if (completedFrom || completedTo) {
      query.where.completedDate = buildDateRangeFilter(completedFrom, completedTo);
    }

    // Fetch job cards and total count
    const [jobCards, total] = await Promise.all([
      prisma.jobCard.findMany({
        ...query,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              registrationNo: true,
              make: true,
              model: true,
              year: true,
            },
          },
          tasks: {
            select: {
              id: true,
              description: true,
              completed: true,
              order: true,
            },
            orderBy: { order: 'asc' },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
        },
      }),
      prisma.jobCard.count({ where: query.where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.jobCard.aggregate({
      where: query.where,
      _sum: {
        estimatedCost: true,
        actualCost: true,
      },
      _count: true,
    });

    // Calculate task completion stats
    const jobCardsWithProgress = jobCards.map(job => {
      const completedTasks = job.tasks.filter(t => t.completed).length;
      const totalTasks = job.tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...job,
        taskProgress: {
          completed: completedTasks,
          total: totalTasks,
          percentage: progress,
        },
      };
    });

    // Build paginated response with summary
    const response = {
      ...buildPaginatedResponse(jobCardsWithProgress, total, page, limit),
      summary: {
        totalEstimatedCost: summary._sum.estimatedCost || 0,
        totalActualCost: summary._sum.actualCost || 0,
        jobCount: summary._count,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job cards:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// POST - Create new job card with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      vehicleId,
      description,
      priority,
      estimatedCost,
      assignedTo,
      tasks,
      userId,
    } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['customerId', 'vehicleId', 'description', 'userId']);
    if (validationError) {
      return NextResponse.json(
        buildErrorResponse(validationError, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        buildErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Verify vehicle exists and belongs to customer
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        buildErrorResponse('Vehicle not found', 'VEHICLE_NOT_FOUND'),
        { status: 404 }
      );
    }

    if (vehicle.customerId !== customerId) {
      return NextResponse.json(
        buildErrorResponse('Vehicle does not belong to this customer', 'VEHICLE_MISMATCH'),
        { status: 400 }
      );
    }

    // Generate job number
    const jobNumber = generateJobNumber();

    // Create job card with tasks
    const jobCard = await prisma.jobCard.create({
      data: {
        jobNumber,
        customerId,
        vehicleId,
        description,
        priority: priority || 'normal',
        status: 'pending',
        estimatedCost: estimatedCost || 0,
        assignedTo,
        userId,
        tasks: tasks && Array.isArray(tasks) && tasks.length > 0 ? {
          create: tasks.map((task: any, index: number) => ({
            description: task.description,
            completed: false,
            order: index + 1,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        vehicle: true,
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'CREATE',
      entity: 'JobCard',
      entityId: jobCard.id,
      details: {
        jobNumber: jobCard.jobNumber,
        customer: customer.name,
        vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.registrationNo})`,
      },
    });

    return NextResponse.json(jobCard, { status: 201 });
  } catch (error) {
    console.error('Error creating job card:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete job cards
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ids = searchParams.get('ids')?.split(',') || [];

    if (!userId) {
      return NextResponse.json(
        buildErrorResponse('User ID is required', 'MISSING_USER_ID'),
        { status: 400 }
      );
    }

    if (ids.length === 0) {
      return NextResponse.json(
        buildErrorResponse('No job card IDs provided', 'MISSING_IDS'),
        { status: 400 }
      );
    }

    // Check if any job cards have invoices
    const jobCardsWithInvoices = await prisma.jobCard.findMany({
      where: {
        id: { in: ids },
        userId,
        invoice: { isNot: null },
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    });

    if (jobCardsWithInvoices.length > 0) {
      return NextResponse.json(
        buildErrorResponse(
          'Cannot delete job cards with invoices',
          'HAS_INVOICES',
          { jobCards: jobCardsWithInvoices }
        ),
        { status: 409 }
      );
    }

    // Delete job cards (cascade will handle tasks)
    const result = await prisma.jobCard.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'BULK_DELETE',
      entity: 'JobCard',
      entityId: 'bulk',
      details: { count: result.count, ids },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} job card(s)`,
    });
  } catch (error) {
    console.error('Error deleting job cards:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
