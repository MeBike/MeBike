import { useQuery } from "@tanstack/react-query";
import { walletService } from "@services/wallet.service";
import { QUERY_KEYS } from "@constants/queryKey";
import type { UserWallet } from "@custom-types";
const fetchAllWalletUser = async ({
  page,
  pageSize,
  id,
}: {
  page?: number;
  pageSize?: number;
  id: string;
}): Promise<UserWallet> => {
  try {
    const response = await walletService.getWalletUser({ page, pageSize, id });
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to fetch wallet user");
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch all wallet users");
  }
};
export const useGetAllWalletQuery = ({
  page,
  pageSize,
  id,
}: {
  page?: number;
  pageSize?: number;
  id: string;
}) => {
  return useQuery<UserWallet>({
    queryKey: QUERY_KEYS.WALLET.ALL_WALLET_USER(id, page, pageSize),
    queryFn: () => fetchAllWalletUser({ page, pageSize, id }),
    enabled: Boolean(id),
  });
};
