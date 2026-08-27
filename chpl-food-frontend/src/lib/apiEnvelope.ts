/**
 * The backend isn't perfectly uniform: CRUD endpoints return
 * `{ message, data }`, paginated list endpoints return
 * `{ data: { rows, count } }` (a raw Sequelize findAndCountAll shape).
 * This normalizes the paginated case so feature hooks don't each re-guard
 * against `rows`/`count` being undefined.
 */
export interface PaginatedResult<T> {
  rows: T[];
  count: number;
}

export function normalizePaginated<T>(data: { rows?: T[]; count?: number } | null | undefined): PaginatedResult<T> {
  return { rows: data?.rows ?? [], count: data?.count ?? 0 };
}
