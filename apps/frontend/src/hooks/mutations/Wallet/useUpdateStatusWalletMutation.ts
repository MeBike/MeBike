import { useMutation } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
export const useUpdateStatusWalletMutation = () => {
  return useMutation({
    mutationFn: ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: "ĐANG HOẠT ĐỘNG" | "ĐÃ BỊ ĐÓNG BĂNG";
    }) => walletService.updateStatusWallet(id, newStatus),
  });
};
