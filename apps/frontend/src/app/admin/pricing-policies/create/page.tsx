"use client";

import { usePricingPolicyActions } from "@hooks/use-pricing-policy";
import PricingPolicyCreateClient from "./client";

export default function CreatePricingPolicyPage() {
  const {
    createPricingPolicy,
    // Nếu trong hook bạn chưa có isCreating, hãy thêm: isCreating: useCreatePricingPolicy.isPending
    // isCreating, 
  } = usePricingPolicyActions({});

  return (
    <PricingPolicyCreateClient 
      onCreate={createPricingPolicy} 
      // isCreating={isCreating} 
    />
  );
}