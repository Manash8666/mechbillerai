import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id: customerId } = await params;

    // Verify tenant ownership of target customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: auth.user.userId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found or unauthorized' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { registrationNo, make, model, year, color } = body;

    if (!registrationNo) {
      return NextResponse.json(
        { error: 'Vehicle registration number is required' },
        { status: 400 }
      );
    }

    const cleanPlate = registrationNo.toUpperCase().trim();

    // Check if vehicle already exists
    let vehicle = await prisma.vehicle.findUnique({
      where: { registrationNo: cleanPlate },
    });

    if (vehicle) {
      // If vehicle exists, update its details and association
      vehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          customerId: customerId,
          make: make || vehicle.make,
          model: model || vehicle.model,
          year: year !== undefined ? parseInt(year) : vehicle.year,
          color: color || vehicle.color,
        },
      });
    } else {
      vehicle = await prisma.vehicle.create({
        data: {
          registrationNo: cleanPlate,
          make: make || 'Standard',
          model: model || 'General',
          year: year !== undefined ? parseInt(year) : undefined,
          color: color || undefined,
          customerId: customerId,
        },
      });
    }

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id: customerId } = await params;

    // Verify tenant ownership of target customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: auth.user.userId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found or unauthorized' },
        { status: 404 }
      );
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { customerId },
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
