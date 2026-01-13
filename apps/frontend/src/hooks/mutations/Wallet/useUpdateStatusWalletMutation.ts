import { useMutation } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
export const useUpdateStatusWalletMutation = () => {
  return useMutation({
    mutationFn: ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: "ACTIVE" | "BLOCKED";
    }) => walletService.updateWalletStatus(id, newStatus),
  });
};
