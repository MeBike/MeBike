import { useQuery } from "@tanstack/react-query";

import type { MyWallet } from "@services/wallet.service";

import { walletService } from "@services/wallet.service";

export async function fetchMyWallet(): Promise<MyWallet> {
  const response = await walletService.getMyWallet();
  if (response.status === 200) {
    return response.data.result as MyWallet;
  }
  throw new Error("Failed to fetch user profile");
}
export function useGetMyWalletQuery() {
  return useQuery({
    queryKey: ["my-wallet"],
    queryFn: () => fetchMyWallet(),
    staleTime: 5 * 60 * 1000,
  });
}
