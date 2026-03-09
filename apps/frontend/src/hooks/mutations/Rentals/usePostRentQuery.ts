import { useMutation } from "@tanstack/react-query";

import type { RentalSchemaFormData } from "@/schemas/rental-schema";

import { rentalService } from "@services/rental.service";
// const usePostRent = () => {
//   return useMutation({
//     mutationFn: ({ data }: RentalSchemaFormData) =>
//       rentalService.userPostRent(data.bike_id),
//   });
// };
export function usePostRentQuery() {
  return useMutation({
    mutationFn: (data: RentalSchemaFormData) =>
      rentalService.userPostRent(data),
  });
}
