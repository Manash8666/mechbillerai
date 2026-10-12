import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildAdvancedQuery,
  buildPaginatedResponse,
  buildErrorResponse,
  validateRequired,
  buildDateRangeFilter,
  logActivity,
} from '@/lib/apiHelpers';

// GET - List appointments with advanced filtering, pagination, search, sorting
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
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    
    // Advanced filters
    const status = searchParams.get('status'); // scheduled, confirmed, in-progress, completed, cancelled, no-show
    const serviceType = searchParams.get('serviceType');
    const customerId = searchParams.get('customerId');
    const bay = searchParams.get('bay');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const today = searchParams.get('today') === 'true';
    const upcoming = searchParams.get('upcoming') === 'true';
    const past = searchParams.get('past') === 'true';

    // Build filters
    const filters: any = { userId };
    
    if (status) filters.status = status;
    if (serviceType) filters.serviceType = serviceType;
    if (customerId) filters.customerId = customerId;
    if (bay) filters.bay = bay;

    // Build query
    const query = buildAdvancedQuery({
      page,
      limit,
      search,
      searchFields: ['serviceType', 'description', 'bay'],
      sortBy,
      sortOrder,
      filters,
    });

    // Add date range filters
    if (today) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.where.date = { gte: todayStart, lte: todayEnd };
    } else if (upcoming) {
      const now = new Date();
      query.where.date = { gte: now };
    } else if (past) {
      const now = new Date();
      query.where.date = { lt: now };
    } else if (dateFrom || dateTo) {
      query.where.date = buildDateRangeFilter(dateFrom, dateTo);
    }

    // Fetch appointments and total count
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
        },
      }),
      prisma.appointment.count({ where: query.where }),
    ]);

    // Add date indicators
    const appointmentsWithIndicators = appointments.map(apt => {
      const aptDate = new Date(apt.date);
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = aptDate >= today && aptDate < tomorrow;
      const isTomorrow = aptDate >= tomorrow && aptDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      const isPast = aptDate < now && apt.status !== 'completed' && apt.status !== 'cancelled';

      return {
        ...apt,
        indicators: {
          isToday,
          isTomorrow,
          isPast,
        },
      };
    });

    // Calculate summary statistics
    const summary = {
      totalCount: total,
      todayCount: await prisma.appointment.count({
        where: {
          userId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      upcomingCount: await prisma.appointment.count({
        where: {
          userId,
          date: { gte: new Date() },
          status: { in: ['scheduled', 'confirmed'] },
        },
      }),
      confirmedCount: await prisma.appointment.count({
        where: {
          userId,
          status: 'confirmed',
        },
      }),
    };

    // Build paginated response with summary
    const response = {
      ...buildPaginatedResponse(appointmentsWithIndicators, total, page, limit),
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// POST - Create new appointment with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      serviceType,
      description,
      date,
      startTime,
      endTime,
      bay,
      notes,
      userId,
    } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['customerId', 'serviceType', 'date', 'startTime', 'userId']);
    if (validationError) {
      return NextResponse.json(
        buildErrorResponse(validationError, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (appointmentDate < now) {
      return NextResponse.json(
        buildErrorResponse('Cannot create appointment in the past', 'INVALID_DATE'),
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

    // Check for conflicting appointments (same bay, overlapping time)
    if (bay) {
      const conflicts = await prisma.appointment.findMany({
        where: {
          userId,
          bay,
          date: appointmentDate,
          status: { notIn: ['cancelled', 'completed'] },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gte: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lte: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          buildErrorResponse(
            'Bay is already booked for this time slot',
            'TIME_CONFLICT',
            { conflicts }
          ),
          { status: 409 }
        );
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        serviceType,
        description,
        date: appointmentDate,
        startTime,
        endTime: endTime || startTime,
        status: 'scheduled',
        bay,
        notes,
        userId,
      },
      include: {
        customer: true,
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        customer: customer.name,
        serviceType: appointment.serviceType,
        date: appointmentDate.toISOString(),
        time: startTime,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete appointments
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
        buildErrorResponse('No appointment IDs provided', 'MISSING_IDS'),
        { status: 400 }
      );
    }

    // Delete appointments
    const result = await prisma.appointment.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      action: 'BULK_DELETE',
      entity: 'Appointment',
      entityId: 'bulk',
      details: { count: result.count, ids },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} appointment(s)`,
    });
  } catch (error) {
    console.error('Error deleting appointments:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
