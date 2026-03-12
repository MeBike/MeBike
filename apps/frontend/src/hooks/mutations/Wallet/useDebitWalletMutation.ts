import { useMutation } from "@tanstack/react-query";
import { DecreaseSchemaFormData } from "@/schemas/wallet-schema";
import { walletService } from "@/services/wallet.service";
export const useDebitWalletMutation = () => {
  return useMutation({
    mutationFn: (data: DecreaseSchemaFormData) => walletService.debitWallet(data),
  });
};
