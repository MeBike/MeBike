"use client";
import { usePricingPolicyActions } from "@hooks/use-pricing-policy";
import PricingPolicyDetailClient from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useEffect, use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    pricingPolicyDetail,
    isLoadingPricingPolicyDetail,
    getPricingPolicyDetail,
  } = usePricingPolicyActions({ id });
  useEffect(() => {
    getPricingPolicyDetail();
  }, []);
  if (isLoadingPricingPolicyDetail) return <LoadingScreen />;
  if (!pricingPolicyDetail) return <div>Không tìm thấy dữ liệu</div>;

  return <PricingPolicyDetailClient data={pricingPolicyDetail} />;
}
