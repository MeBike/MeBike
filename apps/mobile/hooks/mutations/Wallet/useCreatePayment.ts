import { useMutation } from "@tanstack/react-query";
import { walletService } from "@services/wallet.service";
export function useCreatePaymentMutation() {
  return useMutation({
    mutationFn: ({accountId , amount} : {accountId : string , amount : number}) =>
      walletService.createPayment({accountId , amount}),
  });
}