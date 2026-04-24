import type { EnvironmentError } from "@services/environment";

import { environmentService } from "@services/environment";
import { useQuery } from "@tanstack/react-query";

import type { EnvironmentImpactDetail } from "@/contracts/server";

import { environmentKeys } from "./environment-query-keys";

export function useEnvironmentImpactDetailQuery(
  rentalId: string,
  enabled: boolean = true,
  scope?: string | null,
) {
  return useQuery<EnvironmentImpactDetail, EnvironmentError>({
    queryKey: environmentKeys.detail(scope, rentalId),
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      const result = await environmentService.getDetail(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
