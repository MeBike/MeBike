import { useQuery } from "@tanstack/react-query";

import type { RentalBillingDetail } from "@/types/rental-types";
import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";

export function useMyRentalBillingDetailQuery(rentalId: string, enabled: boolean = true, scope?: string | null) {
  return useQuery<RentalBillingDetail, RentalError>({
    queryKey: rentalKeys.meBillingDetail(scope, rentalId),
    enabled: enabled && Boolean(rentalId),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await rentalServiceV1.getMyRentalBillingDetail(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
