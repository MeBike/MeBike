import { useMutation } from "@tanstack/react-query";
import { rentalService } from "@services/rentalService";
import { EndRentalSchema } from "@schemas/rentalSchema";
export interface EndRentalVariables {
  id: string;
  data: EndRentalSchema;
}
const usePutEndCurrentRental = () => {
  return useMutation({
    mutationFn: ({ id, data }: EndRentalVariables) => rentalService.userPutEndCurrentRental(id, data),
  });
};

export default usePutEndCurrentRental;
