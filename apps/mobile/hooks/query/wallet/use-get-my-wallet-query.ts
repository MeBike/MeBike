import { presentWalletError } from "@/presenters/wallets/wallet-error-presenter";
import { walletServiceV1 } from "@services/wallets/wallet.service";
import { useQuery } from "@tanstack/react-query";

import { walletQueryKeys } from "./wallet-query-keys";

export async function fetchMyWallet() {
  const result = await walletServiceV1.getMyWallet();
  if (result.ok) {
    return result.value;
  }
  throw new Error(presentWalletError(result.error));
}
export function useGetMyWalletQuery(enabled: boolean, scope: string | null | undefined) {
  return useQuery({
    queryKey: walletQueryKeys.myWallet(scope),
    queryFn: () => fetchMyWallet(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
