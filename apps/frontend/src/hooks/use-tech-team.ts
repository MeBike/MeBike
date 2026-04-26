

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {useGetAllTechnicianTeamQuery} from "@queries"
import {HTTP_STATUS} from "@constants";
import { TechnicianStatus } from "@/types/TechnicianTeam";
export interface TechnicianActionProps {
  hasToken: boolean , 
  supplier_id ?: string,
  page ?: number,
  pageSize ?: number,
  status?: TechnicianStatus,
}
export const useTechnicianTeamActions = ({hasToken,supplier_id,page,pageSize,status}: TechnicianActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    refetch : refetchAllTechnicianTeam,
    data: allTechnicianTeam,
    isLoading: isLoadingAllTechnicianTeam,
  } = useGetAllTechnicianTeamQuery({
    page:page,
    pageSize:pageSize,
    status:status,
  });
  const getTechnicianTeam = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAllTechnicianTeam();
  }, [hasToken, router]);
  return {
    getTechnicianTeam,
    isLoadingAllTechnicianTeam,
    allTechnicianTeam,
  };
};
