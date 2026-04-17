import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";
const getAdminViewDistributionRequest = async (
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
    const response = await distributionRequestService.getAdminViewDistributionRequest(query);
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetAdminViewDistributionRequestQuery = ({
  page,
  pageSize,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: RedistributionRequestStatus;
}) => {
  return useQuery({
    queryKey: ["admin","distribution-request-data",page,pageSize],
    queryFn: () => getAdminViewDistributionRequest(page, pageSize, status),
    enabled:false,
  });
};
