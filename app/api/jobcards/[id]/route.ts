import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single job card
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        tasks: {
          orderBy: { order: 'asc' },
        },
        invoice: true,
      },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: 'Job card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error('Error fetching job card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE job card
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      priority,
      description,
      estimatedCost,
      actualCost,
      assignedTo,
      completedDate,
      deliveryDate,
      notes,
    } = body;

    const updateData: any = {};
    
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (description !== undefined) updateData.description = description;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;
    
    if (completedDate !== undefined) {
      updateData.completedDate = completedDate ? new Date(completedDate) : null;
    }
    if (deliveryDate !== undefined) {
      updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    const jobCard = await prisma.jobCard.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: true,
        tasks: true,
        invoice: true,
      },
    });

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error('Error updating job card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE job card
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.jobCard.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Job card deleted successfully' });
  } catch (error) {
    console.error('Error deleting job card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
