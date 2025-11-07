import { useMutation } from "@tanstack/react-query";
import { DecreaseSchemaFormData } from "@/schemas/walletSchema";
import { walletService } from "@/services/wallet.service";
import { sosService } from "@/services/sos.service";
export const useDebitWalletMutation = () => {
  return useMutation({
    mutationFn: (data: DecreaseSchemaFormData) =>
      walletService.debitWallet(data),
  });
};
