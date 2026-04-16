"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import SubscriptionDetailClient from "./SubscriptionDetailClient";
import { useSubscriptionAction } from "@/hooks/use-subscription"; 
import { LoadingScreen } from "@/components/loading-screen/loading-screen"; // Điều chỉnh đường dẫn theo dự án của bạn
import type { Subscription } from "@/types"; 

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const {
    getSubscriptionDetail,
    isLoadingSubscriptionDetail,
    subscriptionDetail,
  } = useSubscriptionAction({
    hasToken: true,
    subscription_id: id,
  });

  useEffect(() => {
    if (id) {
      getSubscriptionDetail();
    }
  }, [id, getSubscriptionDetail]);
  const [isVisualLoading, setIsVisualLoading] = useState(true);

  useEffect(() => {
    if (isLoadingSubscriptionDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingSubscriptionDetail]);


  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!subscriptionDetail) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-muted-foreground">Không tìm thấy thông tin gói cước.</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }
  return (
    <SubscriptionDetailClient
      id={id}
      data={subscriptionDetail as Subscription}
    />
  );
}