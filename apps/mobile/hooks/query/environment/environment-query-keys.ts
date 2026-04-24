export const environmentKeys = {
  all: () => ["environment"] as const,
  summary: (scope: string | null | undefined) => ["environment", scope ?? "guest", "summary"] as const,
  historyRoot: (scope: string | null | undefined) => ["environment", scope ?? "guest", "history"] as const,
  history: (args: {
    scope?: string | null;
    pageSize: number;
    sortOrder?: "asc" | "desc";
    dateFrom?: string;
    dateTo?: string;
  }) => [
    "environment",
    args.scope ?? "guest",
    "history",
    args.pageSize,
    args.sortOrder ?? null,
    args.dateFrom ?? null,
    args.dateTo ?? null,
  ] as const,
  detail: (scope: string | null | undefined, rentalId: string) => ["environment", scope ?? "guest", "detail", rentalId] as const,
};
