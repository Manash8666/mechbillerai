import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildErrorResponse,
  validateRequired,
  logActivity,
} from '@/lib/apiHelpers';

// GET - Single customer with full details and activity history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                jobCards: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: includeHistory ? undefined : 10,
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            paid: true,
            balance: true,
            status: true,
            createdAt: true,
          },
        },
        jobCards: {
          orderBy: { createdAt: 'desc' },
          take: includeHistory ? undefined : 10,
          select: {
            id: true,
            jobNumber: true,
            status: true,
            priority: true,
            estimatedCost: true,
            actualCost: true,
            createdAt: true,
            completedDate: true,
            vehicle: {
              select: {
                registrationNo: true,
                make: true,
                model: true,
              },
            },
          },
        },
        _count: {
          select: {
            invoices: true,
            jobCards: true,
            vehicles: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        buildErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Calculate customer statistics
    const totalRevenue = customer.invoices.reduce((sum, inv) => sum + inv.paid, 0);
    const pendingAmount = customer.invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const completedJobs = customer.jobCards.filter(job => job.status === 'completed').length;

    const response = {
      ...customer,
      statistics: {
        totalRevenue,
        pendingAmount,
        completedJobs,
        totalJobs: customer._count.jobCards,
        totalInvoices: customer._count.invoices,
        totalVehicles: customer._count.vehicles,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// PUT - Update customer with validation and history tracking
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address, gstNumber, notes, userId } = body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        buildErrorResponse('Invalid email format', 'INVALID_EMAIL'),
        { status: 400 }
      );
    }

    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        return NextResponse.json(
          buildErrorResponse('Invalid phone number format', 'INVALID_PHONE'),
          { status: 400 }
        );
      }
    }

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        buildErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check for duplicate phone or email (excluding current customer)
    if (phone || email) {
      const duplicate = await prisma.customer.findFirst({
        where: {
          id: { not: id },
          userId: existing.userId,
          OR: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (duplicate) {
        return NextResponse.json(
          buildErrorResponse(
            `Another customer with this ${duplicate.phone === phone ? 'phone' : 'email'} already exists`,
            'DUPLICATE_CUSTOMER'
          ),
          { status: 409 }
        );
      }
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(notes !== undefined && { notes }),
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
    if (userId) {
      await logActivity(prisma, {
        userId,
        action: 'UPDATE',
        entity: 'Customer',
        entityId: customer.id,
        details: { name: customer.name, changes: body },
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Delete customer with cascade check
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const force = searchParams.get('force') === 'true';

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicles: true,
            jobCards: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        buildErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check for related data
    const hasRelatedData = 
      customer._count.vehicles > 0 ||
      customer._count.jobCards > 0 ||
      customer._count.invoices > 0;

    if (hasRelatedData && !force) {
      return NextResponse.json(
        buildErrorResponse(
          'Customer has related data. Use force=true to delete anyway.',
          'HAS_RELATED_DATA',
          {
            vehicles: customer._count.vehicles,
            jobCards: customer._count.jobCards,
            invoices: customer._count.invoices,
          }
        ),
        { status: 409 }
      );
    }

    // Delete customer (cascade will handle related data)
    await prisma.customer.delete({
      where: { id },
    });

    // Log activity
    if (userId) {
      await logActivity(prisma, {
        userId,
        action: 'DELETE',
        entity: 'Customer',
        entityId: id,
        details: { name: customer.name, forced: force },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
      deletedRelatedData: hasRelatedData ? customer._count : null,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
