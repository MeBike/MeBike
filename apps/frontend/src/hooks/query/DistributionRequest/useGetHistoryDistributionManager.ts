import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import type { BikeStatus } from "@/types";
const getManagerViewHistoryDistributionRequest = async ({
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
    const response = await distributionRequestService.getHistoryForManager(query);
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch distribution");
  }
};
export const useGetManagerViewHistoryDistributionRequestQuery = ({
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
      "manager",
      "distribution-request-data",
      "history",
      page,
      pageSize,
      status,
      targetStationId,
    ],
    queryFn: () =>
      getManagerViewHistoryDistributionRequest({
        page,
        pageSize,
        status,
        targetStationId,
      }),
    enabled: false,
  });
};
