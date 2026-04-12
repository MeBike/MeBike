import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
const getAgencyRequests = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await agencyService.getAgencyRequest({
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
export const useGetAgencyRequests = ({page,pageSize}:{page?:number,pageSize?:number}) => {
    return useQuery({
        queryKey:["data","agency-request"],
        queryFn : () => getAgencyRequests({page:page,pageSize:pageSize}),
    })
}
