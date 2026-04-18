import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
const getAdminViewDistributionRequestDetail = async (
  {id}:{id:string}
) => {
  try {
    const response = await distributionRequestService.getAdminViewDistributionRequestDetail({id:id});
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetAdminViewDistributionRequestDetailQuery = ({
  id,
}: {
  id:string;
}) => {
  return useQuery({
    queryKey: ["admin","distribution-request-data","detail",id],
    queryFn: () => getAdminViewDistributionRequestDetail({id:id}),
    enabled:false,
  });
};
