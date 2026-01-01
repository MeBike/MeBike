import { useMutation } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { BikeStatus } from "@/types";
export const useChangeStatusBikeMutation = () => {
  return useMutation({
    mutationFn: ({
      changeBikeStatusId,
      status,
    }: {
      changeBikeStatusId: string;
      status: BikeStatus;
    }) => bikeService.changeStatusBike(changeBikeStatusId, status),
  });
};
