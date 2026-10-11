// Helper de paginación consistente para todos los endpoints.
// Uso: const { page, limit, skip } = parsePagination(req.query);
// Respuesta: { data, pagination: { page, limit, total, totalPages } }

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
}): PaginationParams {
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit;

  const page = Math.max(1, parseInt(String(rawPage ?? '1'), 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(rawLimit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function paginatedResponse<T>(data: T[], page: number, limit: number, total: number) {
  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}
