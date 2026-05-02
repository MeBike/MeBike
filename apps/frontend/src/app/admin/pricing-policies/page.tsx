"use client";

import { useState , useEffect } from "react";
import { usePricingPolicyActions } from "@hooks/use-pricing-policy";
import { PricingPolicyStatus } from "@/types";
import PricingPolicyClient from "./client";

export default function Page() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PricingPolicyStatus | "all">("all");

  const { pricingPolicies, isLoadingPricingPolicies , getPricingPolicies } = usePricingPolicyActions(
    {
      page,
      pageSize: 10,
      status: status === "all" ? undefined : status,
    },
  );

  useEffect(() => {
    getPricingPolicies();
  }, [page, status]);

  return (
    <PricingPolicyClient
      data={{
        policies: pricingPolicies?.data || [],
        pagination: pricingPolicies?.pagination,
        isLoading: isLoadingPricingPolicies,
      }}
      filters={{ page, statusFilter: status }}
      actions={{ setPage, setStatusFilter: setStatus }}
    />
  );
}
