import { Prisma } from '@prisma/client';

// Types for query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  searchFields?: string[];
}

export interface FilterParams {
  [key: string]: any;
}

export interface AdvancedQueryParams extends PaginationParams, SortParams, SearchParams {
  filters?: FilterParams;
}

// Pagination helper
export function getPagination(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

// Search helper - creates OR conditions
export function buildSearchCondition(search: string, fields: string[]) {
  if (!search || !fields.length) return {};

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
      },
    })),
  };
}

// Filter helper - creates AND conditions
export function buildFilterCondition(filters: FilterParams) {
  if (!filters || Object.keys(filters).length === 0) return {};

  const conditions: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Handle different filter types
      if (key.endsWith('_from')) {
        const field = key.replace('_from', '');
        conditions[field] = { ...conditions[field], gte: value };
      } else if (key.endsWith('_to')) {
        const field = key.replace('_to', '');
        conditions[field] = { ...conditions[field], lte: value };
      } else if (key.endsWith('_in')) {
        const field = key.replace('_in', '');
        conditions[field] = { in: Array.isArray(value) ? value : [value] };
      } else if (key.endsWith('_contains')) {
        const field = key.replace('_contains', '');
        conditions[field] = { contains: value };
      } else {
        conditions[key] = value;
      }
    }
  });

  return conditions;
}

// Sort helper
export function buildSortCondition(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Record<string, Prisma.SortOrder> {
  if (!sortBy) return { createdAt: 'desc' as Prisma.SortOrder };
  return { [sortBy]: sortOrder as Prisma.SortOrder };
}

// Combined query builder
export function buildAdvancedQuery(params: AdvancedQueryParams) {
  const {
    page = 1,
    limit = 10,
    search,
    searchFields = [],
    sortBy,
    sortOrder,
    filters = {},
  } = params;

  const pagination = getPagination(page, limit);
  const searchCondition = buildSearchCondition(search || '', searchFields);
  const filterCondition = buildFilterCondition(filters);
  const sortCondition = buildSortCondition(sortBy, sortOrder);

  // Combine search and filters with AND logic
  const where: any = {};
  if (Object.keys(searchCondition).length > 0) {
    Object.assign(where, searchCondition);
  }
  if (Object.keys(filterCondition).length > 0) {
    Object.assign(where, filterCondition);
  }

  return {
    where,
    orderBy: sortCondition,
    ...pagination,
  };
}

// Response builder with pagination metadata
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Error response builder
export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export function buildErrorResponse(
  error: string,
  code?: string,
  details?: any
): ApiError {
  return {
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

// Validation helper
export function validateRequired(data: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field] || data[field] === '') {
      return `Field '${field}' is required`;
    }
  }
  return null;
}

// Bulk operation helper
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export function initBulkResult(): BulkOperationResult {
  return {
    success: 0,
    failed: 0,
    errors: [],
  };
}

// Date range helper
export function buildDateRangeFilter(from?: string | null, to?: string | null) {
  const filter: any = {};
  
  if (from) {
    filter.gte = new Date(from);
  }
  
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // End of day
    filter.lte = toDate;
  }
  
  return Object.keys(filter).length > 0 ? filter : undefined;
}

// Soft delete helper
export async function softDelete<T>(
  model: any,
  id: string,
  userId: string
): Promise<T> {
  return await model.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });
}

// Activity log helper
export async function logActivity(
  prisma: any,
  data: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    details?: any;
  }
) {
  try {
    await prisma.activityLog.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error - logging failure shouldn't break the main operation
  }
}
