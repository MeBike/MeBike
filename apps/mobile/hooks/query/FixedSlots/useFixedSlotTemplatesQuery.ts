import { useInfiniteQuery } from "@tanstack/react-query";

import { fixedSlotService } from "@services/fixed-slot.service";

import type { FixedSlotTemplateListParams } from "@/types/fixed-slot-types";

const DEFAULT_LIMIT = 10;

export function useFixedSlotTemplatesQuery(
  params: FixedSlotTemplateListParams = {},
  enabled: boolean = true,
) {
  const { limit = DEFAULT_LIMIT, status, station_id } = params;

  return useInfiniteQuery({
    queryKey: ["fixed-slots", limit, status ?? null, station_id ?? null],
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await fixedSlotService.getList({
        page: pageParam,
        limit,
        status,
        station_id,
      });
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      if (nextPage <= (lastPage.pagination.totalPages ?? 0))
        return nextPage;
      return undefined;
    },
  });
}
