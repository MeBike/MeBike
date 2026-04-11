import { useGetAgencies, useGetAgencyDetail , useGetAgencyStat } from "@queries";
import { toast } from "sonner";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { id } from "date-fns/locale";
export interface AgencyActionProps {
  hasToken?: boolean;
  agency_id?: string;
  page?: number;
  pageSize?: number;
}
export const useAgencyActions = ({
  hasToken,
  agency_id,
  page,
  pageSize,
}: AgencyActionProps) => {
  const router = useRouter();
  const {
    data: agencies,
    refetch: refetchGetAgencies,
    isLoading: isLoadingAgencies,
  } = useGetAgencies({ page: page, pageSize: pageSize });
  const getAgencies = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchGetAgencies();
  }, [refetchGetAgencies, hasToken, router, page]);
  const {
    data: agencyDetail,
    refetch: refetchAgencyDetail,
    isLoading: isLoadingAgencyDetail,
  } = useGetAgencyDetail({ id: agency_id || "" });
  const getAgencyDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAgencyDetail();
  }, [refetchAgencyDetail, hasToken, router,agency_id]);
  const {data : agencyStats , refetch : refetchAgencyStats , isLoading : isLoadingAgencyStats} = useGetAgencyStat({id : agency_id || ""});
  const getAgencyStat = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchAgencyStats();
  }, [refetchAgencyStats, hasToken, router,agency_id]);
  return {
    agencies,
    getAgencies,
    isLoadingAgencies,
    getAgencyDetail,
    isLoadingAgencyDetail,
    agencyDetail,
    getAgencyStat,
    agencyStats,
    isLoadingAgencyStats,
  };
  
};
