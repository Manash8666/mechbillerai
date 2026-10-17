import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET single inventory item with tenant isolation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
      include: {
        supplier: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE inventory item with tenant isolation
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    // Verify tenant ownership
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      category,
      description,
      quantity,
      unit,
      minQuantity,
      costPrice,
      sellingPrice,
      gstRate,
      location,
      supplierId,
    } = body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        code,
        category,
        description,
        quantity,
        unit,
        minQuantity,
        costPrice,
        sellingPrice,
        gstRate,
        location,
        supplierId,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE inventory item with tenant isolation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    // Verify tenant ownership
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
