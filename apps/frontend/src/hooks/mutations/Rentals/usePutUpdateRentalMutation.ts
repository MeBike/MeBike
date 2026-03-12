import { useMutation } from "@tanstack/react-query";
import { rentalService } from "../../../services/rental.service";
import { UpdateRentalSchema } from "@/schemas/rental-schema";

export const usePutUpdateRentalMutation = (id: string) => {
  return useMutation({
    mutationKey: ["update-rental", id],
    mutationFn: (data: UpdateRentalSchema) =>
      rentalService.updateDetailRental(id, data),
  });
};