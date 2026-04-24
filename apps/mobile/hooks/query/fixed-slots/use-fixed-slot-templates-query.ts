import type { FixedSlotError } from "@services/fixed-slots";

import { fixedSlotService } from "@services/fixed-slots";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { FixedSlotTemplateListParams, FixedSlotTemplateListResponse } from "@/contracts/server";

import { fixedSlotQueryKeys } from "./fixed-slot-query-keys";

const DEFAULT_PAGE_SIZE = 10;

export function useFixedSlotTemplatesQuery(
  params: FixedSlotTemplateListParams = {},
  enabled: boolean = true,
  scope?: string | null,
) {
  const { pageSize = DEFAULT_PAGE_SIZE, status, stationId } = params;

  return useInfiniteQuery<FixedSlotTemplateListResponse, FixedSlotError>({
    queryKey: fixedSlotQueryKeys.list(scope, { pageSize, status, stationId }),
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const result = await fixedSlotService.getList({
        page,
        pageSize,
        status,
        stationId,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      if (nextPage <= (lastPage.pagination.totalPages ?? 0))
        return nextPage;
      return undefined;
    },
  });
}
