export const environmentKeys = {
  all: () => ["environment"] as const,
  summary: () => ["environment", "summary"] as const,
  historyRoot: () => ["environment", "history"] as const,
  history: (args: {
    pageSize: number;
    sortOrder?: "asc" | "desc";
    dateFrom?: string;
    dateTo?: string;
  }) => [
    "environment",
    "history",
    args.pageSize,
    args.sortOrder ?? null,
    args.dateFrom ?? null,
    args.dateTo ?? null,
  ] as const,
  detail: (rentalId: string) => ["environment", "detail", rentalId] as const,
};
