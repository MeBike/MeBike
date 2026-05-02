import {
  useGetAllPricingPoliciesQuery,
  useGetPricingPolicyDetailQuery,
} from "@queries";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PricingPolicyStatus } from "@/types";

export interface PricingPolicyActionProps {
  page?: number;
  pageSize?: number;
  status?: PricingPolicyStatus;
  id?: string;
}
export const usePricingPolicyActions = ({
  page,
  pageSize,
  status,
  id,
}: PricingPolicyActionProps) => {
  const router = useRouter();
  const {
    data: pricingPolicies,
    refetch: refetchGetPricingPolicies,
    isLoading: isLoadingPricingPolicies,
  } = useGetAllPricingPoliciesQuery({
    page,
    pageSize,
    status,
  });
  const getPricingPolicies = useCallback(() => {
    refetchGetPricingPolicies();
  }, [refetchGetPricingPolicies]);
  const {
    data: pricingPolicyDetail,
    refetch: refetchGetPricingPolicyDetail,
    isLoading: isLoadingPricingPolicyDetail,
  } = useGetPricingPolicyDetailQuery({ id: id || "" });
  const getPricingPolicyDetail = useCallback(() => {
    refetchGetPricingPolicyDetail();
  }, [refetchGetPricingPolicyDetail]);
  return {
    pricingPolicies,
    getPricingPolicies,
    isLoadingPricingPolicies,
    pricingPolicyDetail,
    getPricingPolicyDetail,
    isLoadingPricingPolicyDetail,
  };
};
