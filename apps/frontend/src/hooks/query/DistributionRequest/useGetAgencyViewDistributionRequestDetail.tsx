import { useQuery } from "@tanstack/react-query";
import { distributionRequestService } from "@/services/distribution-request.service";
const getAgencyViewDistributionRequestDetail = async (
  {id}:{id: string}
) => {
  try {
    const response = await distributionRequestService.getAgencyViewDistributionRequestDetail({id:id});
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetAgencyViewDistributionRequestDetailQuery = ({
  id,
}: {
  id:string;
}) => {
  return useQuery({
    queryKey: ["agency","distribution-request-data","detail",id],
    queryFn: () => getAgencyViewDistributionRequestDetail({id:id}),
    enabled:false,
  });
};
