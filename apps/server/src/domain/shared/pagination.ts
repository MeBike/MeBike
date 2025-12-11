export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SortDirection = "asc" | "desc";

export type PageRequest<SortField extends string = string> = {
  page: number;
  pageSize: number;
  sortBy?: SortField;
  sortDir?: SortDirection;
};

export function normalizedPage({ page, pageSize }: PageRequest) {
  const p = Math.max(1, page);// default to 1
  const size = Math.max(1, pageSize);
  return {
    page: p,
    pageSize: size,
    skip: (p - 1) * size,
    take: size,
  };
};
export function makePageResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PageResult<T> {
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
  return { items, page, pageSize, total, totalPages };
}
