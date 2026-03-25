import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

export function useMyRentalResolvedDetailQuery(rentalId: string, enabled: boolean = true) {
  return useQuery<MyRentalResolvedDetail, RentalError>({
    queryKey: ["rentals", "me", "resolved-detail", rentalId],
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
