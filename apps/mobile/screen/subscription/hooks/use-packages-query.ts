import { subscriptionService } from "@services/subscription.service";
import { useQuery } from "@tanstack/react-query";

import type {
  PackageListParams,
  PackageListQueryResult,
} from "@/types/subscription-types";

export function usePackagesQuery(params: PackageListParams = {}) {
  const { page = 1, limit = 20, search } = params;

  return useQuery({
    queryKey: ["packages", page, limit, search ?? null],
    queryFn: async () => {
      const response = await subscriptionService.getPackages({
        page,
        limit,
        search,
      });
      const payload: PackageListQueryResult = response.data;
      return payload.data?.Packages?.data ?? [];
    },
  });
}
