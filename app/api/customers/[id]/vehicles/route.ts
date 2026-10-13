import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await request.json();
    const { registrationNo, make, model } = body;

    if (!registrationNo) {
      return NextResponse.json(
        { error: 'Vehicle registration number is required' },
        { status: 400 }
      );
    }

    // Check if vehicle already exists
    let vehicle = await prisma.vehicle.findUnique({
      where: { registrationNo: registrationNo.toUpperCase() },
    });

    if (vehicle) {
      // If vehicle exists, associate with customer if not already or update
      vehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          customerId: customerId,
          make: make || vehicle.make,
          model: model || vehicle.model,
        },
      });
    } else {
      vehicle = await prisma.vehicle.create({
        data: {
          registrationNo: registrationNo.toUpperCase(),
          make: make || 'Standard',
          model: model || 'General',
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
    const { id: customerId } = await params;
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
