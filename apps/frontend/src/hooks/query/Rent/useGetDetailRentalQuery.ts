import { useQuery } from "@tanstack/react-query";

import { rentalService } from "@services/rental.service";

export function useGetDetailRentalQuery(id: string) {
  return useQuery({
    queryKey: ["rentals", "detail", id],
    queryFn: () => {
      return rentalService.userGetRentalById(id);
    },
    enabled: !!id,
  });
}
