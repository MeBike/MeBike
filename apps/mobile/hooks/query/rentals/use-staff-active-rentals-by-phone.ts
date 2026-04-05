import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { RentalListResponse } from "@/types/rental-types";

type LookupQueryArgs = {
  phone: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
};

export function useStaffActiveRentalsByPhone({
  phone,
  page = 1,
  pageSize = 5,
  enabled = true,
}: LookupQueryArgs) {
  return useQuery<RentalListResponse, RentalError>({
    enabled,
    queryKey: ["staff-active-rentals-by-phone", phone, page, pageSize],
    queryFn: () =>
      rentalServiceV1.listActiveRentalsByPhone({ phone, page, pageSize }).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.value;
      }),
  });
}
