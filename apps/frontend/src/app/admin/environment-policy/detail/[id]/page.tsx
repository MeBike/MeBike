"use client"; 

import { useEffect, useState } from "react";
import Client from "./client"; 
import { useEnvironmentPolicy } from "@/hooks/use-environment-policy";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params.id as string; // Lấy ID từ URL
  
  const {
    dataEnvironmentPolicy,
    isLoadingEnvironmentPolicy,
    getEnvironmentPolicies,
    activeEnvironmentPolicty,
  } = useEnvironmentPolicy({
    hasToken: true,
  });
  
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (isLoadingEnvironmentPolicy) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingEnvironmentPolicy]);
  
  useEffect(() => {
    getEnvironmentPolicies();
  }, [getEnvironmentPolicies]);

  if (isLoadingEnvironmentPolicy) {
    return <div>Đang tải...</div>;
  }
  
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const currentPolicyDetail = dataEnvironmentPolicy?.data?.find(
    (item) => item.id === id
  )
  if (!currentPolicyDetail) {
    return <div className="p-10 text-center text-muted-foreground">Không tìm thấy thông tin chính sách.</div>;
  }
  return (
    <Client
      data={currentPolicyDetail}
      onActivate={async () => {
         await activeEnvironmentPolicty(currentPolicyDetail.id);
      }}
    />
  );
}