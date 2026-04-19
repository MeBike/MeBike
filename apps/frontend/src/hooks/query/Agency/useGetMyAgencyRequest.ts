import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getMyAgencyRequests = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await agencyService.getMyAgencyRequest({
      page: page,
      pageSize: pageSize,
    });
    if (response.status === HTTP_STATUS.OK) {
        return response.data
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch agencies");
  }
};
export const useGetMyAgencyRequests = ({page,pageSize}:{page?:number,pageSize?:number}) => {
    return useQuery({
        queryKey:["data","my-agency-request"],
        queryFn : () => getMyAgencyRequests({page:page,pageSize:pageSize}),
        enabled:false,
    })
}