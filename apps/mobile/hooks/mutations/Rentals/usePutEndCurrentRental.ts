import { useMutation } from "@tanstack/react-query";

import { rentalService } from "@services/rentalService";

export type EndRentalVariables = {
  id: string;
};
function usePutEndCurrentRental() {
  return useMutation({
    mutationFn: ({ id }: EndRentalVariables) => rentalService.userPutEndCurrentRental(id),
  });
}

export default usePutEndCurrentRental;
