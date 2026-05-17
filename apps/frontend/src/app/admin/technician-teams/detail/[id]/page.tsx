"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTechnicianTeamActions } from "@/hooks/use-tech-team";
import { TechnicianTeamDetailView } from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { UpdateTechnicianTeamSchema } from "@/schemas/technician-schema";

export default function TechnicianTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  const {
    technicianTeamDetail,
    getTechnicianTeamDetail,
    isLoadingTechnicianTeamDetail,
    updateTechnicianTeam,
  } = useTechnicianTeamActions({
    hasToken: true,
    teamId: id,
  });

  useEffect(() => {
    if (id) {
      getTechnicianTeamDetail();
    }
  }, [id, getTechnicianTeamDetail]);

  useEffect(() => {
    if (isLoadingTechnicianTeamDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingTechnicianTeamDetail]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  if (!isLoadingTechnicianTeamDetail && !technicianTeamDetail?.data) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-medium">
          Không tìm thấy thông tin đội kỹ thuật.
        </p>
      </div>
    );
  }

  const handleSubmit = async (data: UpdateTechnicianTeamSchema) => {
    try {
      const result = await updateTechnicianTeam(id, data);
      if (result) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <TechnicianTeamDetailView
          team={technicianTeamDetail!.data}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}