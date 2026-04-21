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
      }, 600);
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

  // 1. Dùng .find() để lọc ra object có id trùng với params.id
  // Dựa theo type bạn đưa, dataEnvironmentPolicy.data là một mảng Environment[]
  const currentPolicyDetail = dataEnvironmentPolicy?.data?.find(
    (item) => item.id === id
  );

  // 2. Nếu tìm không thấy (mảng rỗng hoặc sai id) -> Báo lỗi
  if (!currentPolicyDetail) {
    return <div className="p-10 text-center text-muted-foreground">Không tìm thấy thông tin chính sách.</div>;
  }

  // 3. Nếu tìm thấy, truyền thẳng nguyên object xuống Client
  return (
    <Client
      data={currentPolicyDetail}
      onActivate={async () => {
         // Truyền id vào hàm theo định nghĩa của bạn
         await activeEnvironmentPolicty(currentPolicyDetail.id);
      }}
    />
  );
}