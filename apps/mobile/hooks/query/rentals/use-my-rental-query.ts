import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { Rental } from "@/types/rental-types";

export function useMyRentalQuery(rentalId: string, enabled: boolean = true, scope?: string | null) {
  return useQuery<Rental, RentalError>({
    queryKey: rentalKeys.meDetail(scope, rentalId),
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      const result = await rentalServiceV1.getMyRental(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
