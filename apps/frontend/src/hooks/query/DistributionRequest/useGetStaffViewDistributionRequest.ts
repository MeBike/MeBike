import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";
const getStaffViewDistributionRequest = async ({
  page,
  pageSize,
  status,
  requestedByUserId,
  approvedByUserId,
  sourceStationId,
  targetStationId,
}: {
  page?: number;
  pageSize?: number;
  status?: RedistributionRequestStatus;
  requestedByUserId?: string;
  approvedByUserId?: string;
  sourceStationId?: string;
  targetStationId?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (status) query.status = status;
    if (requestedByUserId) query.requestedByUserId = requestedByUserId;
    if (approvedByUserId) query.approvedByUserId = approvedByUserId;
    if (sourceStationId) query.sourceStationId = sourceStationId;
    if (targetStationId) query.targetStationId = targetStationId;
    const response =
      await distributionRequestService.getStaffViewDistributionRequest(query);
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetStaffViewDistributionRequestQuery = ({
  page,
  pageSize,
  status,
  requestedByUserId,
  approvedByUserId,
  sourceStationId,
  targetStationId,
}: {
  page?: number;
  pageSize?: number;
  status?: RedistributionRequestStatus;
  requestedByUserId?: string;
  approvedByUserId?: string;
  sourceStationId?: string;
  targetStationId?: string;
}) => {
  return useQuery({
    queryKey: ["staff", "distribution-request-data", page, pageSize],
    queryFn: () =>
      getStaffViewDistributionRequest({
        page,
        pageSize,
        status,
        requestedByUserId,
        approvedByUserId,
        sourceStationId,
        targetStationId,
      }),
    enabled: false,
  });
};
