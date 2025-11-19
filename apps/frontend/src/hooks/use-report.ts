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
interface ErrorWithMessage {
  message: string;
}
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
      error?: string;
    };
  };
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const data = axiosError.response.data;
    const { errors, message, error: errorField } = data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
    if (errorField) return errorField;
    // If data is a string, return it
    if (typeof data === "string") return data;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }
  return defaultMessage;
};
export const useUserReport = ({
  hasToken,
  page,
  limit,
  id,
}: {
  hasToken: boolean;
  page?: number;
  limit?: number;
  id?: string;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    data: reports,
    refetch: refetchReports,
    isFetching: isFetchingReports,
  } = useGetAllManageReportQuery({ page, limit });
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
                queryClient.invalidateQueries({ queryKey: ["all", "report"] });
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
    [hasToken, router, queryClient, refetchReports, useUpdateReport]
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
                queryClient.invalidateQueries({
                  queryKey: ["reports", "in-progress", page, limit],
                });
                getReportInProgress();
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
    [hasToken, router, queryClient, useResolveReport, getReportInProgress, page, limit]
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
