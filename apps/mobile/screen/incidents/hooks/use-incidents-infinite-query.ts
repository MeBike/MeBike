import type { IncidentError, IncidentListParams } from "@services/incidents";
import type { InfiniteData } from "@tanstack/react-query";

import { incidentService } from "@services/incidents";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { IncidentListResponse } from "@/contracts/server";

import { incidentKeys } from "./incident-query-keys";

type IncidentInfiniteFilters = Omit<IncidentListParams, "page">;

function flattenPages(data: InfiniteData<IncidentListResponse> | undefined) {
  return data?.pages.flatMap(page => page.data) ?? [];
}

export function useIncidentsInfiniteQuery(
  filters: IncidentInfiniteFilters = {},
  enabled: boolean = true,
) {
  const query = useInfiniteQuery<IncidentListResponse, IncidentError>({
    queryKey: incidentKeys.list(filters),
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await incidentService.listIncidents({
        ...filters,
        page: Number(pageParam),
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.value;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  return {
    ...query,
    incidents: flattenPages(query.data),
  };
}
