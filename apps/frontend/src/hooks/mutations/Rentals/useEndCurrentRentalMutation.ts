import { useMutation } from "@tanstack/react-query";
import { rentalService } from "@/services/rental.service";
import { EndRentalSchema } from "@/schemas/rentalSchema";

const useEndCurrentRental = (id : string) => {
  return useMutation({
    mutationFn: (data : EndRentalSchema) => rentalService.endRentalByReport(id, data),
  });
};

export default useEndCurrentRental;
