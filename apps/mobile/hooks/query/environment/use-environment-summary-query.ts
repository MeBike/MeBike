import type { EnvironmentError } from "@services/environment";

import { environmentService } from "@services/environment";
import { useQuery } from "@tanstack/react-query";

import type { EnvironmentSummary } from "@/contracts/server";

import { environmentKeys } from "./environment-query-keys";

export function useEnvironmentSummaryQuery(enabled: boolean = true, scope?: string | null) {
  return useQuery<EnvironmentSummary, EnvironmentError>({
    queryKey: environmentKeys.summary(scope),
    enabled,
    queryFn: async () => {
      const result = await environmentService.getSummary();
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
