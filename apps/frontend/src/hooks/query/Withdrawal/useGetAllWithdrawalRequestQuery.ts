import { useQuery } from "@tanstack/react-query";
import { withdrawalsService } from "@services/withdrawal.service";
import { WithdrawStatus } from "@/types";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchAllWithdrawRequests = async ({
  page,
  limit,
  status,
}: {
  page?: number;
  limit?: number;
  status?: WithdrawStatus;
}) => {
  try {
    const response = await withdrawalsService.getAllWithdrawRequests({
      page: page || 1,
      limit: limit || 10,
      status: status || "",
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetAllWithdrawRequestQuery = ({
  page,
  limit,
  status,
}: {
  page?: number;
  limit?: number;
  status?: WithdrawStatus;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.WITHDRAW.ALL_WITHDRAW_REQUESTS(page, limit, status),
    queryFn: () => fetchAllWithdrawRequests({ page, limit, status }),
  });
};
