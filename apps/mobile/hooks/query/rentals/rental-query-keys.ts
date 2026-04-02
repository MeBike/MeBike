import type {
  BikeSwapRequestListParams,
  RentalStatus,
} from "@/types/rental-types";

export const rentalKeys = {
  all: () => ["rentals"] as const,

  me: () => ["rentals", "me"] as const,
  meHistory: () => ["rentals", "me", "history"] as const,
  meHistoryPage: (pageSize: number) => ["rentals", "me", "history", pageSize] as const,
  meCounts: (status?: RentalStatus | null) =>
    ["rentals", "me", "counts", status ?? null] as const,
  meDetail: (rentalId: string) => ["rentals", "me", "detail", rentalId] as const,
  meResolvedDetail: (rentalId: string) =>
    ["rentals", "me", "resolved-detail", rentalId] as const,

  staff: () => ["rentals", "staff"] as const,
  staffDetail: (rentalId: string) => ["rentals", "staff", "detail", rentalId] as const,

  bikeSwap: {
    mePreview: (rentalId: string) =>
      ["rentals", "me", "bike-swap", "preview", rentalId] as const,
    staff: () => ["rentals", "staff", "bike-swap"] as const,
    staffList: (params: BikeSwapRequestListParams = {}) =>
      [
        "rentals",
        "staff",
        "bike-swap",
        "list",
        params.userId ?? null,
        params.stationId ?? null,
        params.status ?? null,
        params.sortBy ?? null,
        params.sortDir ?? null,
        params.page ?? null,
        params.pageSize ?? null,
      ] as const,
    staffDetail: (bikeSwapRequestId: string) =>
      ["rentals", "staff", "bike-swap", "detail", bikeSwapRequestId] as const,
  },
} as const;
