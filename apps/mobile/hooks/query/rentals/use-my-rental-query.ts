import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { Rental } from "@/types/rental-types";

export function useMyRentalQuery(rentalId: string, enabled: boolean = true) {
  return useQuery<Rental, RentalError>({
    queryKey: ["rentals", "me", "detail", rentalId],
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
