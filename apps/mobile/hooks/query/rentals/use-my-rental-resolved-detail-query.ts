import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

export function useMyRentalResolvedDetailQuery(rentalId: string, enabled: boolean = true, scope?: string | null) {
  return useQuery<MyRentalResolvedDetail, RentalError>({
    queryKey: rentalKeys.meResolvedDetail(scope, rentalId),
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      const result = await rentalServiceV1.getMyRentalResolvedDetail(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
