export const reservationQueryKeys = {
  root: () => ["reservations"] as const,
  pending: (scope: string | null | undefined, page: number, pageSize: number) =>
    ["reservations", scope ?? "guest", "pending", page, pageSize] as const,
  history: (scope: string | null | undefined, page: number, pageSize: number, version: number) =>
    ["reservations", scope ?? "guest", "history", page, pageSize, version] as const,
  detail: (scope: string | null | undefined, reservationId: string) =>
    ["reservations", scope ?? "guest", "detail", reservationId] as const,
  stationLookup: (stationId?: string | null) => ["reservations", "station-lookup", stationId ?? null] as const,
};
