import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(request);
    const body = await request.json();
    const { userId: bodyUserId, type, category, amount, paymentMode, description, date, reference, notes } = body;

    const userId = session?.userId || bodyUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.ledgerEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Ledger entry not found or unauthorized' }, { status: 404 });
    }

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category.trim();
    if (amount !== undefined) updateData.amount = Number(amount);
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode.toLowerCase();
    if (description !== undefined) updateData.description = description.trim();
    if (date !== undefined) updateData.date = new Date(date);
    if (reference !== undefined) updateData.reference = reference ? reference.trim() : null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    const updated = await prisma.ledgerEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    return NextResponse.json({ error: 'Failed to update ledger entry' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const session = await getSessionUser(request);
    const userId = session?.userId || queryUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.ledgerEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Ledger entry not found or unauthorized' }, { status: 404 });
    }

    await prisma.ledgerEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Ledger entry deleted' });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    return NextResponse.json({ error: 'Failed to delete ledger entry' }, { status: 500 });
  }
}
