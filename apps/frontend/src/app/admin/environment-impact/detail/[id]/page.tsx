"use client";

import { useEffect, useState } from "react";
import Client from "./client";
import { useEnvironmentPolicy } from "@/hooks/use-environment-policy";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  const {
    dataEnvironmentImpactDetail,
    isLoadingEnvironmentImpactDetail,
    getEnvironmentImpactDetail,
  } = useEnvironmentPolicy({
    hasToken: true,
    id: id,
  });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingEnvironmentImpactDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingEnvironmentImpactDetail]);
  useEffect(() => {
    if (id) {
      getEnvironmentImpactDetail();
    }
  }, [getEnvironmentImpactDetail, id]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const recordDetail = dataEnvironmentImpactDetail;
  if (!recordDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        Không tìm thấy thông tin bản ghi CO2.
      </div>
    );
  }
  return <Client data={recordDetail} />;
}
