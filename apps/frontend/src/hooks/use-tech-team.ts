

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CreateTechnicianTeamSchema,UpdateTechnicianTeamSchema } from "@schemas/technician-schema";
import { toast } from "sonner";
import {useGetAllTechnicianTeamQuery,useGetTechnicianTeamDetailQuery} from "@queries"
import { getErrorMessageFromSupplierCode , getAxiosErrorCodeMessage } from "@utils";
import {HTTP_STATUS} from "@constants";
import { TechnicianTeamRecord , TechnicianStatus } from "@/columns/technician-team-column";
export interface TechnicianActionProps {
  hasToken: boolean , 
  supplier_id ?: string,
  page ?: number,
  pageSize ?: number,
  status?: TechnicianStatus,
}
export const useSupplierActions = ({hasToken,supplier_id,page,pageSize,status}: TechnicianActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    refetch : refetchAllSuppliers,
    data: allSupplier,
    isLoading: isLoadingAllSuppliers,
  } = useGetAllTechnicianTeamQuery({
    page:page,
    pageSize:pageSize,
    status:status,
  });
  return {
  };
};
