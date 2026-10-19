import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET single job card
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;
    const jobCard = await prisma.jobCard.findFirst({
      where: { id, userId },
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
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.jobCard.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Job card not found or unauthorized' },
        { status: 404 }
      );
    }

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
      voiceNote,
      preInspectionShield,
    } = body;

    const updateData: any = {};
    
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (description !== undefined) updateData.description = description;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;
    if (voiceNote !== undefined) updateData.voiceNote = voiceNote;
    if (preInspectionShield !== undefined) {
      updateData.preInspectionShield = typeof preInspectionShield === 'object' ? JSON.stringify(preInspectionShield) : preInspectionShield;
    }
    
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
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const userId = auth.user.userId;

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.jobCard.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Job card not found or unauthorized' },
        { status: 404 }
      );
    }

    // Unlink any invoice referencing this job card
    await prisma.invoice.updateMany({
      where: { jobCardId: id },
      data: { jobCardId: null },
    });

    // Delete tasks
    await prisma.jobTask.deleteMany({
      where: { jobCardId: id },
    });

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
