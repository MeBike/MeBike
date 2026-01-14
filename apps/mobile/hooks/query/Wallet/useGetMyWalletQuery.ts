import { walletService } from "@services/wallet.service";
import { useQuery } from "@tanstack/react-query";

import type { Wallet } from "@/types";

export async function fetchMyWallet(): Promise<Wallet> {
  const response = await walletService.getMyWallet();
  if (response.status === 200) {
    return response.data.data?.GetWallet.data as Wallet;
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
