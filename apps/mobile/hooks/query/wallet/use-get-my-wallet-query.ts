import { presentWalletError } from "@/presenters/wallets/wallet-error-presenter";
import { walletServiceV1 } from "@services/wallets/wallet.service";
import { useQuery } from "@tanstack/react-query";

export async function fetchMyWallet() {
  const result = await walletServiceV1.getMyWallet();
  if (result.ok) {
    return result.value;
  }
  throw new Error(presentWalletError(result.error));
}
export function useGetMyWalletQuery() {
  return useQuery({
    queryKey: ["my-wallet"],
    queryFn: () => fetchMyWallet(),
    staleTime: 5 * 60 * 1000,
  });
}
