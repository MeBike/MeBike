import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";
const getManagerViewDistributionRequest = async (
  page?: number,
  pageSize?: number,
  status?: RedistributionRequestStatus
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(status) query.status = status;
    const response = await distributionRequestService.getManagerViewDistributionRequest(query);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetManagerViewDistributionRequestQuery = ({
  page,
  pageSize,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: RedistributionRequestStatus;
}) => {
  return useQuery({
    queryKey: ["manager","distribution-request-data"],
    queryFn: () => getManagerViewDistributionRequest(page, pageSize, status),
  });
};
