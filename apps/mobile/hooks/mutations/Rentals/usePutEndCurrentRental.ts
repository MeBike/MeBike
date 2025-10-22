import { useMutation } from "@tanstack/react-query";
import { rentalService } from "@services/rentalService";
import { EndRentalSchema } from "@schemas/rentalSchema";
export interface EndRentalVariables {
  id: string;
}
const usePutEndCurrentRental = () => {
  return useMutation({
    mutationFn: ({ id }: EndRentalVariables) => rentalService.userPutEndCurrentRental(id),
  });
};

export default usePutEndCurrentRental;
