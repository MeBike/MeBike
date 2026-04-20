import { useMutation } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";

export const useTechnicianUpdateBikeStatus = () => {
  return useMutation({
    mutationKey: ["bikes", "update-status", "technician"],
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "AVAILABLE" | "BROKEN";
    }) => bikeService.updateBikeStatusTechnician({ id, status }),
  });
};
