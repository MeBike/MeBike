import { useMutation } from "@tanstack/react-query";

import { rentalService } from "@services/rental.service";

export type StaffEndRentalVariables = {
  id: string;
  end_station: string;
  reason: string;
  end_time?: string;
};

function usePutStaffEndRental() {
  return useMutation({
    mutationFn: ({ id, ...payload }: StaffEndRentalVariables) =>
      rentalService.staffAdminEndRental(id, payload),
  });
}

export default usePutStaffEndRental;
