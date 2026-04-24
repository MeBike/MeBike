import type { FixedSlotTemplateListParams } from "@/contracts/server";

export const fixedSlotQueryKeys = {
  all: () => ["fixed-slots"] as const,
  list: (scope: string | null | undefined, params: FixedSlotTemplateListParams = {}) => [
    "fixed-slots",
    scope ?? "guest",
    params.pageSize ?? 10,
    params.status ?? null,
    params.stationId ?? null,
  ] as const,
  detail: (scope: string | null | undefined, id?: string) => ["fixed-slots", scope ?? "guest", "detail", id] as const,
};
