import { useMutation } from "@tanstack/react-query";
import { rentalService } from "@services/rentalService";
import { RentalSchemaFormData } from "@schemas/rentalSchema";
// const usePostRent = () => {
//   return useMutation({
//     mutationFn: ({ data }: RentalSchemaFormData) =>
//       rentalService.userPostRent(data.bike_id),
//   });
// };
export const usePostRentQuery = () => {
  return useMutation({
    mutationFn: (data: RentalSchemaFormData) =>
      rentalService.userPostRent(data),
  });
};
