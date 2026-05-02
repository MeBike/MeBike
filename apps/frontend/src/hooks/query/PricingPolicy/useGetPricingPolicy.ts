import { useQuery } from "@tanstack/react-query";
import { pricingService } from "@/services/pricing.service";
import type { PricingPolicyStatus } from "@/types";
import { HTTP_STATUS } from "@/constants";
const getAllPricingPolicies = async (
  page?: number,
  pageSize?: number,
  status?: PricingPolicyStatus,
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (status) query.status = status;
    const response = await pricingService.getListPricingPolicy(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch pricing policies");
  }
};
export const useGetAllPricingPoliciesQuery = ({
  page,
  pageSize,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: PricingPolicyStatus;
}) => {
  return useQuery({
    queryKey: ["data","pricing-policy",page,pageSize,status],
    queryFn: () => getAllPricingPolicies(page, pageSize, status),
    enabled:false,
  });
};
