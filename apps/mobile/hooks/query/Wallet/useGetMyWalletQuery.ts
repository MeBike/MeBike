import { useQuery } from "@tanstack/react-query";

import type { Wallet } from "@/types";

import { walletService } from "@services/wallet.service";

export async function fetchMyWallet(): Promise<Wallet> {
  const response = await walletService.getMyWallet();
  if (response.status === 200) {
    console.log(response.data.data?.GetWallet.data);
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
