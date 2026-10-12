import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildAdvancedQuery,
  buildPaginatedResponse,
  buildErrorResponse,
  validateRequired,
  logActivity,
} from '@/lib/apiHelpers';

// GET - List inventory with advanced filtering, pagination, search, sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Advanced filters
    const category = searchParams.get('category');
    const stockStatus = searchParams.get('stockStatus'); // low, out, in-stock
    const quantityFrom = searchParams.get('quantityFrom');
    const quantityTo = searchParams.get('quantityTo');
    const priceFrom = searchParams.get('priceFrom');
    const priceTo = searchParams.get('priceTo');

    // Build filters
    const filters: any = {};
    
    if (category) {
      filters.category = category;
    }

    // Stock status filter
    if (stockStatus === 'out') {
      filters.quantity = 0;
    } else if (stockStatus === 'low') {
      filters.quantity = { gt: 0 };
      filters.OR = [
        { quantity: { lt: prisma.inventoryItem.fields.minQuantity } },
      ];
    } else if (stockStatus === 'in-stock') {
      filters.quantity = { gte: prisma.inventoryItem.fields.minQuantity };
    }

    if (quantityFrom || quantityTo) {
      filters.quantity = filters.quantity || {};
      if (quantityFrom) filters.quantity.gte = parseInt(quantityFrom);
      if (quantityTo) filters.quantity.lte = parseInt(quantityTo);
    }

    if (priceFrom || priceTo) {
      filters.sellingPrice = {};
      if (priceFrom) filters.sellingPrice.gte = parseFloat(priceFrom);
      if (priceTo) filters.sellingPrice.lte = parseFloat(priceTo);
    }

    // Build query
    const query = buildAdvancedQuery({
      page,
      limit,
      search,
      searchFields: ['name', 'code', 'category', 'location', 'supplier'],
      sortBy,
      sortOrder,
      filters,
    });

    // Fetch items and total count
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany(query),
      prisma.inventoryItem.count({ where: query.where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.inventoryItem.aggregate({
      where: query.where,
      _sum: {
        quantity: true,
      },
      _avg: {
        costPrice: true,
        sellingPrice: true,
      },
      _count: true,
    });

    // Calculate low stock count
    const lowStockCount = await prisma.inventoryItem.count({
      where: {
        ...query.where,
        quantity: {
          gt: 0,
          lt: prisma.inventoryItem.fields.minQuantity,
        },
      },
    });

    const outOfStockCount = await prisma.inventoryItem.count({
      where: {
        ...query.where,
        quantity: 0,
      },
    });

    // Add stock status to each item
    const itemsWithStatus = items.map(item => ({
      ...item,
      stockStatus: 
        item.quantity === 0 ? 'out-of-stock' :
        item.quantity < item.minQuantity ? 'low-stock' :
        'in-stock',
      profitMargin: item.costPrice > 0 
        ? ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(2)
        : '0',
    }));

    // Build paginated response with summary
    const response = {
      ...buildPaginatedResponse(itemsWithStatus, total, page, limit),
      summary: {
        totalItems: summary._count,
        totalQuantity: summary._sum.quantity || 0,
        averageCostPrice: summary._avg.costPrice || 0,
        averageSellingPrice: summary._avg.sellingPrice || 0,
        lowStockCount,
        outOfStockCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// POST - Create new inventory item with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      category,
      quantity,
      unit,
      minQuantity,
      costPrice,
      sellingPrice,
      gstRate,
      location,
      supplier,
      userId,
    } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'code', 'category', 'quantity', 'unit']);
    if (validationError) {
      return NextResponse.json(
        buildErrorResponse(validationError, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate numbers
    if (quantity < 0 || (minQuantity && minQuantity < 0)) {
      return NextResponse.json(
        buildErrorResponse('Quantity values cannot be negative', 'INVALID_QUANTITY'),
        { status: 400 }
      );
    }

    if (costPrice && costPrice < 0) {
      return NextResponse.json(
        buildErrorResponse('Cost price cannot be negative', 'INVALID_PRICE'),
        { status: 400 }
      );
    }

    if (sellingPrice && sellingPrice < 0) {
      return NextResponse.json(
        buildErrorResponse('Selling price cannot be negative', 'INVALID_PRICE'),
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await prisma.inventoryItem.findFirst({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        buildErrorResponse('Item with this code already exists', 'DUPLICATE_CODE'),
        { status: 409 }
      );
    }

    // Create item
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        code,
        category,
        quantity: quantity || 0,
        unit,
        minQuantity: minQuantity || 0,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0,
        gstRate: gstRate || 0,
        location,
        supplier,
      },
    });

    // Log activity
    if (userId) {
      await logActivity(prisma, {
        userId,
        action: 'CREATE',
        entity: 'InventoryItem',
        entityId: item.id,
        details: {
          name: item.name,
          code: item.code,
          quantity: item.quantity,
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete inventory items
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      return NextResponse.json(
        buildErrorResponse('No item IDs provided', 'MISSING_IDS'),
        { status: 400 }
      );
    }

    // Delete items
    const result = await prisma.inventoryItem.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    // Log activity
    if (userId) {
      await logActivity(prisma, {
        userId,
        action: 'BULK_DELETE',
        entity: 'InventoryItem',
        entityId: 'bulk',
        details: { count: result.count, ids },
      });
    }

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} item(s)`,
    });
  } catch (error) {
    console.error('Error deleting inventory items:', error);
    return NextResponse.json(
      buildErrorResponse('Internal server error', 'SERVER_ERROR', error),
      { status: 500 }
    );
  }
}
