import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAllWithdrawRequestQuery } from "./query/Withdrawal/useGetAllWithdrawalRequestQuery";
import { useGetDetailWithdrawRequestQuery } from "./query/Withdrawal/useGetDetailWithdrawalRequestQuery";
import { WithdrawStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useUpdateWithdrawRequestMutation } from "./mutations/Withdrawal/useUpdateWithdrawalRequestMutation";
import { toast } from "sonner";
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
            queryKey: ["withdrawRequests", page, limit, status],
          });
          queryClient.invalidateQueries({ queryKey: ["withdrawRequest", id] });
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
    ]
  );
  return {
    response: data?.data,
    isLoading,
    isError,
    getAllWithdrawRequest,
    getDetailWithdrawRequest,
    detailResponse: detailData?.result,
    isDetailLoading,
    pagination: data?.pagination,
    refetch,
    updateWithdrawRequest,
  };
};
