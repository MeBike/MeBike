import { useQuery } from "@tanstack/react-query";

import { rentalService } from "@services/rental.service";

export function useGetDetailRentalForStaffQuery(id: string) {
  return useQuery({
    queryKey: ["rentals", "detail","staff", id],
    queryFn: () => {
      return rentalService.getDetailRentalForStaff(id);
    },
    enabled: !!id,
  });
}
