import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAllWithdrawRequestQuery } from "./query/Withdrawal/useGetAllWithdrawalRequestQuery";
import { useGetDetailWithdrawRequestQuery } from "./query/Withdrawal/useGetDetailWithdrawalRequestQuery";
import { WithdrawStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useUpdateWithdrawRequestMutation } from "./mutations/Withdrawal/useUpdateWithdrawalRequestMutation";
import { toast } from "sonner";
import { useGetAllWithdrawalOverviewQuery } from "./query/Withdrawal/useGetAllWithdrawalOverviewQuery";
import { QUERY_KEYS } from "@/constants/queryKey";
export const useWithdrawAction = ({
  page,
  limit,
  status,
  hasToken,
  id,
}: {
  hasToken?: boolean;
  page?: number;
  limit?: number;
  status?: WithdrawStatus;
  id?: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetAllWithdrawRequestQuery({
    page,
    limit,
    status,
  });
  const getAllWithdrawRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/auth/login");
    }
    refetch();
  }, [hasToken, router, refetch]);
  const {
    data: detailData,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useGetDetailWithdrawRequestQuery({ id: id || "" });
  const getDetailWithdrawRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/auth/login");
    }
    refetchDetail();
  }, [hasToken, router, refetchDetail]);
  const useUpdateWithdrawRequest = useUpdateWithdrawRequestMutation(id || "");
  const updateWithdrawRequest = useCallback(
    async (data: Parameters<typeof useUpdateWithdrawRequest.mutateAsync>[0]) => {
      if (!hasToken) {
        router.push("/auth/login");
        return;
      }
      await useUpdateWithdrawRequest.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Cập nhật yêu cầu rút tiền thành công");
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.WITHDRAW.ALL_WITHDRAW_REQUESTS(page, limit, status),
          });
          queryClient.invalidateQueries({ 
            queryKey: QUERY_KEYS.WITHDRAW.DETAIL_WITHDRAW_REQUEST(id || ""),
            refetchType: "active"
          });
          refetchDetail();
        },
        onError: (error) => {
          console.log(error);
        },
      });
    },
    [
      hasToken,
      router,
      useUpdateWithdrawRequest,
      queryClient,
      id,
      limit,
      page,
      status,
      refetchDetail,
    ]
  );
  const { data: overviewResponse } = useGetAllWithdrawalOverviewQuery();
  return {
    response: data?.data || [],
    isLoading,
    isError,
    getAllWithdrawRequest,
    getDetailWithdrawRequest,
    detailResponse: detailData?.result,
    isDetailLoading,
    pagination: data?.pagination,
    refetch,
    updateWithdrawRequest,
    overviewResponse,
  };
};
