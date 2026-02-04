import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type { RentalListResponse } from "@/types/rental-types";

type LookupVariables = {
  phone: string;
  page?: number;
  pageSize?: number;
};

export function useStaffActiveRentalsByPhone() {
  return useMutation<RentalListResponse, RentalError, LookupVariables>({
    mutationFn: ({ phone, page = 1, pageSize = 5 }) =>
      rentalServiceV1.listActiveRentalsByPhone({ phone, page, pageSize }).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.value;
      }),
  });
}
