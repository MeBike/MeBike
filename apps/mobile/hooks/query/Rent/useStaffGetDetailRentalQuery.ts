import { useQuery } from "@tanstack/react-query";

import { rentalService } from "@services/rental.service";

export function useStaffGetDetailRentalQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["rentals", "detail", "staff", id],
    queryFn: () => rentalService.staffAdminGetDetailRental(id),
    enabled: enabled && !!id,
  });
}
