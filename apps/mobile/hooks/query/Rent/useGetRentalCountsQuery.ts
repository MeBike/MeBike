import { useQuery } from "@tanstack/react-query";

import { rentalService } from "@services/rental.service";

export function useGetRentalCountsQuery(status: string = "HOÀN THÀNH", enabled: boolean = true) {
  return useQuery({
    queryKey: ["rentals", "counts", status],
    enabled,
    queryFn: () => rentalService.userGetRentalCounts(status),
  });
}
