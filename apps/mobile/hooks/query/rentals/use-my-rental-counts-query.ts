import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { RentalCounts, RentalStatus } from "@/types/rental-types";

export function useMyRentalCountsQuery(
  options?: { status?: RentalStatus; enabled?: boolean; scope?: string | null },
) {
  const status = options?.status;
  const enabled = options?.enabled ?? true;
  const scope = options?.scope;

  return useQuery<RentalCounts, RentalError>({
    queryKey: rentalKeys.meCounts(scope, status),
    enabled,
    queryFn: async () => {
      const result = await rentalServiceV1.getMyRentalCounts(status);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
