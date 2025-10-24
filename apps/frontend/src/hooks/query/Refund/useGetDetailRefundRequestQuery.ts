import { useQuery } from "@tanstack/react-query";
import { refundService } from "@services/refund.service";
import axios from "axios";
import { toast } from "sonner";
const fetchDetailRefundRequests = async ({
    id
}: {
  id :string
}) => {
  try {
    const response = await refundService.getRefundRequestById(id);
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
export const useGetDetailRefundRequestQuery = ({
  id
}: {
  id : string
}) => {
  return useQuery({
    queryKey: ["refundRequests", id],
    queryFn: () => fetchDetailRefundRequests({ id }),
    enabled: !!id
  });
};
