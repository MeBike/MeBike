import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getAgencyRequests = async ({
  page,
  pageSize,
  requesterUserId,
  status,
  requesterEmail,
  agencyName,
}: {
  page?: number;
  pageSize?: number;
  requesterUserId?: string;
  status?: string;
  requesterEmail?: string;
  agencyName?: string;
}) => {
  try {
    const query: Record<string, number | string | undefined> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(requesterUserId) query.requesterUserId = requesterUserId;
    if(status) query.status = status;
    if (requesterEmail) query.requesterEmail = requesterEmail;
    if (agencyName) query.agencyName = agencyName;
    const response = await agencyService.getAgencyRequest(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch agencies");
  }
};
export const useGetAgencyRequests = ({
  page,
  pageSize,
  requesterUserId,
  status,
  requesterEmail,
  agencyName,
}: {
  page?: number;
  pageSize?: number;
  requesterUserId?: string;
  status?: string;
  requesterEmail?: string;
  agencyName?: string;
}) => {
  return useQuery({
    queryKey: ["data", "agency-request"],
    queryFn: () =>
      getAgencyRequests({
        page: page,
        pageSize: pageSize,
        requesterUserId: requesterUserId,
        status: status,
        requesterEmail: requesterEmail,
        agencyName: agencyName,
      }),
    enabled: false,
  });
};
