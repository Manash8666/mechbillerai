import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, customerName, phone, vehicleReg, serviceType, appointmentDate, notes } = body;

    if (!userId || !customerName || !phone || !vehicleReg) {
      return NextResponse.json(
        { error: 'Customer name, phone number, and vehicle registration are required' },
        { status: 400 }
      );
    }

    // 1. Get or create customer for this garage
    let customer = await prisma.customer.findFirst({
      where: {
        userId,
        phone,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId,
          name: customerName,
          phone,
          notes: 'Booked via Online Customer Portal',
        },
      });
    }

    // 2. Schedule Appointment
    const appDate = appointmentDate ? new Date(appointmentDate) : new Date(Date.now() + 86400000);
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        customerId: customer.id,
        serviceType: serviceType || 'General Service',
        date: appDate,
        startTime: '10:00 AM',
        status: 'confirmed',
        notes: `Vehicle: ${vehicleReg.toUpperCase()}${notes ? ` | Notes: ${notes}` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment successfully booked! The workshop team has been notified.',
      appointmentId: appointment.id,
      scheduledAt: appointment.date,
    });
  } catch (error) {
    console.error('Error booking portal appointment:', error);
    return NextResponse.json({ error: 'Internal server error booking appointment' }, { status: 500 });
  }
}
