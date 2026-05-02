"use client";

import { usePricingPolicyActions } from "@hooks/use-pricing-policy";
import PricingPolicyDetailClient from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useEffect, use, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isVisualLoading, setIsVisualLoading] = useState(true);
  const {
    pricingPolicyDetail,
    isLoadingPricingPolicyDetail,
    getPricingPolicyDetail,
    updatePricingPolicy,
    activePricingPolicy,
    isUpdating,
    isActivating,
  } = usePricingPolicyActions({ id });

  useEffect(() => {
    getPricingPolicyDetail();
  }, [id, getPricingPolicyDetail]);
  useEffect(() => {
    if (isLoadingPricingPolicyDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingPricingPolicyDetail]);
  if (!pricingPolicyDetail) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin gói giá.
        </p>
      </div>
    );
  }
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  return (
    <PricingPolicyDetailClient
      data={pricingPolicyDetail}
      onActive={() => activePricingPolicy(id)}
      onUpdate={(formData) => updatePricingPolicy({ id, data: formData })}
      isUpdating={isUpdating}
      isActivating={isActivating}
    />
  );
}
