import { useMutation } from "@tanstack/react-query";
import { TopUpSchemaFormData } from "@/schemas/walletSchema";
import { walletService } from "@/services/wallet.service";
export const useTopUpWalletMutation = () => {
    return useMutation({
        mutationFn: (data: TopUpSchemaFormData) => walletService.topUpWallet(data),
    })
}