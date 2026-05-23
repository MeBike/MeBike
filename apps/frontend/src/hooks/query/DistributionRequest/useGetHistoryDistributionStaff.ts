import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import type { BikeStatus } from "@/types";
const getStaffViewHistoryDistributionRequest = async ({
  page,
  pageSize,
  status,
  targetStationId,
}: {
  page?: number;
  pageSize?: number;
  status?: BikeStatus;
  targetStationId?: string;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (status) query.status = status;
    if (targetStationId) query.targetStationId = targetStationId;
    const response = await distributionRequestService.getHistoryForStaff(query);
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch distributions");
  }
};
export const useGetStaffViewHistoryDistributionRequestQuery = ({
  page,
  pageSize,
  status,
  targetStationId,
}: {
  page?: number;
  pageSize?: number;
  status?: BikeStatus;
  targetStationId?: string;
}) => {
  return useQuery({
    queryKey: [
      "staff",
      "distribution-request-data",
      "history",
      page,
      pageSize,
      status,
      targetStationId,
    ],
    queryFn: () =>
      getStaffViewHistoryDistributionRequest({
        page,
        pageSize,
        status,
        targetStationId,
      }),
    enabled: false,
  });
};
