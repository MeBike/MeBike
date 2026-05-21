import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
import type { BikeStatus } from "@/types";
const getAgencyViewHistoryDistributionRequest = async ({
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
export const useGetAgencyViewHistoryDistributionRequestQuery = ({
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
      "agency",
      "distribution-request-data",
      "history",
      page,
      pageSize,
      status,
      targetStationId,
    ],
    queryFn: () =>
      getAgencyViewHistoryDistributionRequest({
        page,
        pageSize,
        status,
        targetStationId,
      }),
    enabled: false,
  });
};
