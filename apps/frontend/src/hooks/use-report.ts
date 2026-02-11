import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetAllManageReportQuery } from "./query/Report/useGetAllReportQuery";
import { useGetReportOverview } from "./query/Report/useGetReportOverview";
import { useUpdateReportMutation } from "./mutations/Report/useUpdateReportMutation";
import { useGetReportInProgressQuery } from "./query/Report/useGetReportInProgress";
import type {
  ResolveReportSchemaFormData,
  UpdateReportSchemaFormData,
} from "@/schemas/reportSchema";
import { useRouter } from "next/navigation";
import { useResolveReportMutation } from "./mutations/Report/useResolveReportMutation";
import { useGetReportByIdQuery } from "./query/Report/useGetReportByIDQuery";
import type { ReportStatus } from "@/types";
import { QUERY_KEYS } from "@/constants/queryKey";
import getErrorMessage from "@/utils/error-message";
export const useUserReport = ({
  hasToken,
  page,
  limit,
  id,
  status,
}: {
  hasToken: boolean;
  page?: number;
  limit?: number;
  id?: string;
  status?: ReportStatus;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    data: reports,
    refetch: refetchReports,
    isFetching: isFetchingReports,
  } = useGetAllManageReportQuery({ page, limit, status });
  const { data: reportOverview, refetch: refetchReportOverview } =
    useGetReportOverview();
  const refreshReports = useCallback(async () => {
    if (!hasToken) return;
    refetchReports();
  }, [hasToken, refetchReports]);
  const useUpdateReport = useUpdateReportMutation();
  const refreshReportOverview = useCallback(async () => {
    if (!hasToken) return;
    refetchReportOverview();
  }, [hasToken, refetchReportOverview]);
  const updateReport = useCallback(
    async (id: string, data: UpdateReportSchemaFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useUpdateReport.mutate(
        { id, data },
        {
          onSuccess: (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result?.status === 200) {
              const message = result?.data?.message;
              if (
                message &&
                message !== "Update trạng thái report thành công!"
              ) {
                toast.error(message);
              } else {
                toast.success("Cập nhật báo cáo thành công");
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORT.ALL_REPORTS(
                  page, limit, status
                )});
                refetchReports();
              }
            } else {
              const errorMessage =
                result?.data?.message || "Lỗi khi cập nhật báo cáo";
              toast.error(errorMessage);
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Lỗi khi cập nhật báo cáo"
            );
            toast.error(errorMessage);
          },
        }
      );
    },
    [hasToken, router, queryClient, refetchReports, useUpdateReport, page, limit, status]
  );
  const {
    data: reportInProgress,
    refetch: refetchingReportInProgress,
    isLoading: isLoadingReportInProgress,
  } = useGetReportInProgressQuery({ page: page ?? 1, limit: limit ?? 10 });
  const getReportInProgress = useCallback(async () => {
    if (!hasToken) return;
    refetchingReportInProgress();
  }, [hasToken, refetchingReportInProgress]);
  const useResolveReport = useResolveReportMutation();
  const resolveReport = useCallback(
    async (id: string, data: ResolveReportSchemaFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useResolveReport.mutate(
        { id, data },
        {
          onSuccess: (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result?.status === 200) {
              const message = result?.data?.message;
              if (
                message &&
                message !== "Update trạng thái report thành công!"
              ) {
                toast.error(message);
              } else {
                toast.success("Cập nhật báo cáo thành công!");
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORT.ALL_REPORTS(
                  page, limit, status
                )});
                refetchReports();
              }
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Lỗi khi cập nhật báo cáo"
            );
            toast.error(errorMessage);
          },
        }
      );
    },
    [
      hasToken,
      router,
      queryClient,
      useResolveReport,
      refetchReports,
      page
      , limit, status
    ]
  );
  const {data : reportById , refetch: refetchReportById , isLoading: isLoadingReportById} = useGetReportByIdQuery({id : id ?? ""}); 
  const getReportById = useCallback(async () => {
    if (!hasToken) return;
    refetchReportById();
  }
  , [hasToken, refetchReportById]);
  return {
    reports: reports?.data || [],
    refetchReports,
    isFetchingReports,
    refreshReports,
    reportOverview: reportOverview?.result,
    refreshReportOverview,
    pagination: reports?.pagination,
    updateReport: updateReport,
    getReportInProgress,
    reportInProgress,
    isLoadingReportInProgress,
    resolveReport,
    getReportById,
    reportById,
    isLoadingReportById,
  };
};
