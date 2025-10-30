import { useQuery } from "@tanstack/react-query";

import { rentalService } from "@services/rental.service";

export function useGetAllRentalsQuery(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["rentals", "all", page, limit],
    queryFn: ({ queryKey }) => {
      const [, , pageParam, limitParam] = queryKey;
      return rentalService.userGetAllRentals(
        pageParam as number,
        limitParam as number
      );
    },
  });
}
