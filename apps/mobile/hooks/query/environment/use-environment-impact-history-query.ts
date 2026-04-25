import type { EnvironmentError } from "@services/environment";

import { environmentService } from "@services/environment";
import { useInfiniteQuery } from "@tanstack/react-query";

import type {
  EnvironmentImpactHistoryQuery,
  EnvironmentImpactHistoryResponse,
} from "@/contracts/server";

import { environmentKeys } from "./environment-query-keys";

const DEFAULT_PAGE_SIZE = 20;

export function useEnvironmentImpactHistoryQuery(
  params: EnvironmentImpactHistoryQuery = {},
  enabled: boolean = true,
  scope?: string | null,
) {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    sortOrder,
    dateFrom,
    dateTo,
  } = params;

  return useInfiniteQuery<EnvironmentImpactHistoryResponse, EnvironmentError>({
    queryKey: environmentKeys.history({
      scope,
      pageSize,
      sortOrder,
      dateFrom,
      dateTo,
    }),
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const requestedPage = typeof pageParam === "number" ? pageParam : Number(pageParam);
      const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
      const result = await environmentService.getHistory({
        page,
        pageSize,
        sortOrder,
        dateFrom,
        dateTo,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}
