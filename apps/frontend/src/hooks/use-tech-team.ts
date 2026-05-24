

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {useGetAllTechnicianTeamQuery , useGetTechnicianTeamDetailQuery} from "@queries";
import { useCreateTechnicianTeamMutation,useUpdateTechnicianTeamMutation } from "./mutations";
import {HTTP_STATUS} from "@constants";
import { TechnicianStatus } from "@/types/TechnicianTeam";
import { CreateTechnicianTeamSchema , UpdateTechnicianTeamSchema } from "@/schemas/technician-schema";
import { getErrorMessageFromTechnicianTeamCode , getAxiosErrorCodeMessage } from "@utils";
export interface TechnicianActionProps {
  hasToken: boolean , 
  supplier_id ?: string,
  page ?: number,
  pageSize ?: number,
  status?: TechnicianStatus,
  teamId ?: string,
  station_id ?: string,
}
export const useTechnicianTeamActions = ({hasToken,supplier_id,page,pageSize,status,teamId,station_id}: TechnicianActionProps) => {
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
    stationId:station_id
  });
  const getTechnicianTeam = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAllTechnicianTeam();
  }, [hasToken, router,station_id,page,pageSize,status]);
  const {
    refetch : refetchTechnicianTeamDetail,
    data: technicianTeamDetail,
    isLoading: isLoadingTechnicianTeamDetail,
  } = useGetTechnicianTeamDetailQuery(
    teamId || ""
  );
  const getTechnicianTeamDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchTechnicianTeamDetail();
  }, [hasToken, router]);
  const useCreateTechnicianTeam = useCreateTechnicianTeamMutation();
  const useUpdateTechnicianTeam = useUpdateTechnicianTeamMutation();
  const createTechnicianTeam = useCallback(
    async (technicianTeamData: CreateTechnicianTeamSchema) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateTechnicianTeam.mutateAsync(technicianTeamData);
        if(result.status === HTTP_STATUS.CREATED){
          toast.success("Tạo đội kỹ thuật thành công");
          getTechnicianTeam();
        }
        return result;
      } catch (error) {
        const code_error = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromTechnicianTeamCode(code_error));
        throw error; 
      }
    },
    [hasToken, router, queryClient, useCreateTechnicianTeam]
  );
  const updateTechnicianTeam = useCallback(
    async (teamId: string, technicianTeamData: UpdateTechnicianTeamSchema) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useUpdateTechnicianTeam.mutateAsync({teamId, technicianTeamData});
        if(result.status === HTTP_STATUS.OK){
          toast.success("Cập nhật đội kỹ thuật thành công");
          getTechnicianTeam();
          getTechnicianTeamDetail();
          // queryClient.invalidateQueries({
          //   queryKey: ["data", "technician-team-detail" , teamId]
          // });
        }
        return result;
      } catch (error) {
        const code_error = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromTechnicianTeamCode(code_error));
        throw error; 
      }
    },
    [hasToken, router, queryClient, useUpdateTechnicianTeam,getTechnicianTeam,getTechnicianTeamDetail,teamId]
  );

  return {
    getTechnicianTeam,
    isLoadingAllTechnicianTeam,
    allTechnicianTeam,
    createTechnicianTeam,
    technicianTeamDetail,
    getTechnicianTeamDetail,
    isLoadingTechnicianTeamDetail,
    updateTechnicianTeam

  };
};
