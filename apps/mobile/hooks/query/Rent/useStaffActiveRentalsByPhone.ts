import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { rentalService } from "@services/rental.service";
import type { StaffActiveRental } from "@/types/RentalTypes";
import type { Pagination } from "@/types/Pagination";

type StaffLookupResponse = {
  data: StaffActiveRental[];
  pagination: Pagination;
};

type LookupVariables = {
  phone: string;
  page?: number;
  limit?: number;
};

export function useStaffActiveRentalsByPhone() {
  return useMutation<
    AxiosResponse<StaffLookupResponse>,
    unknown,
    LookupVariables
  >({
    mutationFn: ({ phone, page = 1, limit = 5 }) =>
      rentalService.staffGetActiveRentalsByPhone(phone, { page, limit }),
  });
}
