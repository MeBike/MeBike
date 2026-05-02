import { useQuery } from "@tanstack/react-query";
import { pricingService } from "@/services/pricing.service";
import { HTTP_STATUS } from "@/constants";
const getPricingPolicyDetail = async (id: string) => {
  try {
    const response = await pricingService.getPricingPolicyDetail(id);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch pricing policy detail");
  }
};
export const useGetPricingPolicyDetailQuery = ({
  id,
}: {
  id: string;
}) => {
  return useQuery({
    queryKey: ["data","detail","pricing-policy",id],
    queryFn: () => getPricingPolicyDetail(id),
    enabled : false,
  });
};
