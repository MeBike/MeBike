import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { RentalBillingPreview } from "@/types/rental-types";

export function useMyRentalBillingPreviewQuery(rentalId: string, enabled: boolean = true, scope?: string | null) {
  return useQuery<RentalBillingPreview, RentalError>({
    queryKey: rentalKeys.meBillingPreview(scope, rentalId),
    enabled: enabled && Boolean(rentalId),
    refetchInterval: enabled ? 30000 : false,
    retry: false,
    queryFn: async () => {
      const result = await rentalServiceV1.getMyRentalBillingPreview(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
