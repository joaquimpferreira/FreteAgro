// lib/api/pagination.ts — server-side pagination helpers (Principle V)
// Principle V: lists > 50 rows MUST use server-side pagination.
// All list endpoints accept page/pageSize and enforce the 50-row cap.

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE     = 50

export interface PaginationParams {
  page: number
  pageSize: number
  skip: number
  take: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Parses and clamps pagination query params from a URL search string.
 * page defaults to 1; pageSize defaults to DEFAULT_PAGE_SIZE, capped at MAX_PAGE_SIZE.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const rawPage     = parseInt(searchParams.get('page')     ?? '1', 10)
  const rawPageSize = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10)

  const page     = Math.max(1, isNaN(rawPage)     ? 1               : rawPage)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, isNaN(rawPageSize) ? DEFAULT_PAGE_SIZE : rawPageSize))

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

/**
 * Builds a standard paginated response envelope.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  { page, pageSize }: PaginationParams,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize)
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
