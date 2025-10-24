import { useQuery } from "@tanstack/react-query";
import { refundService } from "@services/refund.service";
import { RefundStatus } from "@/types";
const fetchAllRefundRequests = async ({
  page,
  limit,
  status,
}: {
  page?: number;
  limit?: number;
  status?: RefundStatus;
}) => {
  try {
    const response = await refundService.getAllRefundRequests({
      page: page || 1,
      limit: limit || 10,
      status: status || "",
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }
};
export const useGetAllRefundRequestQuery = ({
  page,
  limit,
  status,
}: {
  page?: number;
  limit?: number;
  status?: RefundStatus;
}) => {
  return useQuery({
    queryKey: ["refundRequests", page, limit, status],
    queryFn: () => fetchAllRefundRequests({ page, limit, status }),
  });
};
