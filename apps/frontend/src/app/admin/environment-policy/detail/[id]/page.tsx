"use client"; // Vì trang này dùng hooks, cần phải là Client Component

import { useEffect, useState } from "react";
import Client from "./client"; // Đây là file Client Component của bạn
import { useEnvironmentPolicy } from "@/hooks/use-environment-policy";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
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
  return (
    // <Client
    //   // Dữ liệu trả về thường là một object có thuộc tính .data hoặc mảng
    //   data={dataEnvironmentPolicy?.data}
    //   onActivate={activeEnvironmentPolicty}
    // />
    <>hello world</>
  );
}
