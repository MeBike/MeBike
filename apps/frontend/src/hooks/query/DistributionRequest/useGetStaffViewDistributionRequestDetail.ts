import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
const getStaffViewDistributionRequestDetail = async (
  {id}:{id:string}
) => {
  try {
    const response = await distributionRequestService.getStaffViewDistributionRequestDetail({id:id});
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetStaffViewDistributionRequestDetailQuery = ({
  id,
}: {
  id:string;
}) => {
  return useQuery({
    queryKey: ["staff","distribution-request-data","detail",id],
    queryFn: () => getStaffViewDistributionRequestDetail({id:id}),
    enabled:false,
  });
};
