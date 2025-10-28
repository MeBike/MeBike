import { useQuery } from "@tanstack/react-query";

import type { MyWallet } from "@services/walletService";

import { walletService } from "@services/walletService";

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
