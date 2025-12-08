import { useQuery } from "@tanstack/react-query";
import { withdrawalsService } from "@/services/withdrawal.service";
import axios from "axios";
import { toast } from "sonner";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchDetailWithdrawRequests = async ({ id }: { id: string }) => {
  try {
    const response = await withdrawalsService.getWithdrawRequestById(id);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Đã xảy ra lỗi không xác định";
      toast.error(message);
      return;
    }
    toast.error("Lỗi không xác định");
    throw error;
  }
};
export const useGetDetailWithdrawRequestQuery = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: QUERY_KEYS.WITHDRAW.DETAIL_WITHDRAW_REQUEST(id),
    queryFn: () => fetchDetailWithdrawRequests({ id }),
    enabled: !!id,
  });
};
