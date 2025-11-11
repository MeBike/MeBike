import { useQuery } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

import type { FixedSlotTemplateListParams } from "@/types/fixed-slot-types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export function useFixedSlotTemplatesQuery(
  params: FixedSlotTemplateListParams = {},
  enabled: boolean = true,
) {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, status, station_id } =
    params;

  return useQuery({
    queryKey: [
      "fixed-slots",
      page,
      limit,
      status ?? null,
      station_id ?? null,
    ],
    enabled,
    queryFn: async () => {
      const response = await fixedSlotService.getList({
        page,
        limit,
        status,
        station_id,
      });
      return response.data;
    },
  });
}
