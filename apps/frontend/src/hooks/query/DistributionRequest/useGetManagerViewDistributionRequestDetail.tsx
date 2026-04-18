import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
const getManagerViewDistributionRequestDetail = async (
  {id}:{id: string}
) => {
  try {
    const response = await distributionRequestService.getManagerViewDistributionRequestDetail({id:id});
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetManagerViewDistributionRequestDetailQuery = ({
  id,
}: {
  id:string;
}) => {
  return useQuery({
    queryKey: ["manager","distribution-request-data","detail",id],
    queryFn: () => getManagerViewDistributionRequestDetail({id:id}),
    enabled:false,
  });
};
