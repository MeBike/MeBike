"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTechnicianTeamActions } from "@/hooks/use-tech-team";
import { TechnicianTeamDetailView } from "./client"; // Component đã thiết kế ở bước trước
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

export default function TechnicianTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  // State để quản lý hiệu ứng loading mượt mà hơn (tránh flash nhanh)
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  const {
    technicianTeamDetail,
    getTechnicianTeamDetail,
    isLoadingTechnicianTeamDetail,
  } = useTechnicianTeamActions({ 
    hasToken: true, 
    teamId: id 
  });

  // Gọi API lấy dữ liệu chi tiết khi ID thay đổi
  useEffect(() => {
    if (id) {
      getTechnicianTeamDetail();
    }
  }, [id, getTechnicianTeamDetail]);

  // Xử lý logic Loading tương tự BikeDetailPage
  useEffect(() => {
    if (isLoadingTechnicianTeamDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600); // Tạo độ trễ nhẹ để UI ổn định
      return () => clearTimeout(timer);
    }
  }, [isLoadingTechnicianTeamDetail]);

  // Trường hợp không tìm thấy dữ liệu sau khi đã load xong
  if (!isLoadingTechnicianTeamDetail && !technicianTeamDetail?.data) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-medium">
          Không tìm thấy thông tin đội kỹ thuật.
        </p>
        <button 
          onClick={() => router.back()}
          className="text-primary hover:underline text-sm"
        >
          Quay lại trang trước
        </button>
      </div>
    );
  }
  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  const handleUpdateTeam = async (teamId: string) => {
    console.log("Update team ID:", teamId);
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <TechnicianTeamDetailView
          team={technicianTeamDetail!.data}
          onUpdate={handleUpdateTeam}
        />
      </div>
    </div>
  );
}