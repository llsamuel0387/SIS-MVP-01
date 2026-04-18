export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  page: number;
  pageSize: number;
};

export type PaginatedResponse<T> = {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function normalizePageNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export function normalizePageSize(
  value: number | string | null | undefined,
  fallback = DEFAULT_PAGE_SIZE
): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

export function createPaginatedResponse<T>(
  rows: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    rows,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export function createEmptyPaginatedResponse<T>(pageSize = DEFAULT_PAGE_SIZE): PaginatedResponse<T> {
  return createPaginatedResponse([], 0, 1, pageSize);
}
