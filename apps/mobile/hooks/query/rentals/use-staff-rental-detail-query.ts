import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { RentalDetail } from "@/types/rental-types";

export function useStaffRentalDetailQuery(rentalId: string, enabled: boolean = true) {
  return useQuery<RentalDetail, RentalError>({
    queryKey: ["rentals", "admin", "detail", rentalId],
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      const result = await rentalServiceV1.getAdminRentalDetail(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
