import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { RentalCounts, RentalStatus } from "@/types/rental-types";

export function useMyRentalCountsQuery(
  options?: { status?: RentalStatus; enabled?: boolean },
) {
  const status = options?.status;
  const enabled = options?.enabled ?? true;

  return useQuery<RentalCounts, RentalError>({
    queryKey: ["rentals", "me", "counts", status ?? null],
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
