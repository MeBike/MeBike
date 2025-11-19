import { useMutation } from "@tanstack/react-query";
import { sosService } from "@/services/sos.service";

export const useCreateRentalSOSRequestMutation = (sosId: string) => {
  return useMutation({
    mutationKey: ["create-rental-sos", sosId],
    mutationFn: () =>
      sosService.createNewRentalSOS(sosId),
  });
};
