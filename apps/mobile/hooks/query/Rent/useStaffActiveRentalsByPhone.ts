import { useMutation } from "@tanstack/react-query";
import type { AxiosError, AxiosResponse } from "axios";

import { rentalService, type StaffActiveRentalsResponse } from "@services/rental.service";

type LookupVariables = {
  phone: string;
  page?: number;
  limit?: number;
};

export function useStaffActiveRentalsByPhone() {
  return useMutation<
    AxiosResponse<StaffActiveRentalsResponse>,
    AxiosError<{ message?: string }>,
    LookupVariables
  >({
    mutationFn: ({ phone, page = 1, limit = 5 }) =>
      rentalService.staffGetActiveRentalsByPhone(phone, { page, limit }),
  });
}
