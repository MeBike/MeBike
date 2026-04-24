import type {
  BikeSwapRequestListParams,
  RentalStatus,
} from "@/types/rental-types";

export const rentalKeys = {
  all: () => ["rentals"] as const,

  meRoot: () => ["rentals", "me"] as const,
  me: (scope: string | null | undefined) => ["rentals", "me", scope ?? "guest"] as const,
  meHistory: (scope: string | null | undefined) => ["rentals", "me", scope ?? "guest", "history"] as const,
  meHistoryPage: (scope: string | null | undefined, pageSize: number) => ["rentals", "me", scope ?? "guest", "history", pageSize] as const,
  meCounts: (scope: string | null | undefined, status?: RentalStatus | null) =>
    ["rentals", "me", scope ?? "guest", "counts", status ?? null] as const,
  meDetail: (scope: string | null | undefined, rentalId: string) => ["rentals", "me", scope ?? "guest", "detail", rentalId] as const,
  meResolvedDetail: (scope: string | null | undefined, rentalId: string) =>
    ["rentals", "me", scope ?? "guest", "resolved-detail", rentalId] as const,

  staff: () => ["rentals", "staff"] as const,
  staffDetail: (rentalId: string) => ["rentals", "staff", "detail", rentalId] as const,
  staffActiveByPhone: (phone: string, page: number, pageSize: number) =>
    ["rentals", "staff", "active-by-phone", phone, page, pageSize] as const,

  bikeSwap: {
    mePreview: (scope: string | null | undefined, rentalId: string) =>
      ["rentals", "me", scope ?? "guest", "bike-swap", "preview", rentalId] as const,
    meList: (scope: string | null | undefined, params: BikeSwapRequestListParams = {}) =>
      [
        "rentals",
        "me",
        scope ?? "guest",
        "bike-swap",
        "list",
        params.rentalId ?? null,
        params.status ?? null,
        params.sortBy ?? null,
        params.sortDir ?? null,
        params.page ?? null,
        params.pageSize ?? null,
      ] as const,
    meDetail: (scope: string | null | undefined, bikeSwapRequestId: string | null) =>
      ["rentals", "me", scope ?? "guest", "bike-swap", "detail", bikeSwapRequestId] as const,
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
