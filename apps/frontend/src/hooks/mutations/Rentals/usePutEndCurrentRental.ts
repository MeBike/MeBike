import { useMutation } from "@tanstack/react-query";
import { rentalService } from "@/services/rental.service";

const usePutEndCurrentRental = () => {
  return useMutation({
    mutationFn: (id: string) => rentalService.userPutEndCurrentRental(id),
  });
};

export default usePutEndCurrentRental;
