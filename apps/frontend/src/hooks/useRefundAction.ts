import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAllRefundRequestQuery } from "./query/Refund/useGetAllRefundRequestQuery";
import { useGetDetailRefundRequestQuery } from "./query/Refund/useGetDetailRefundRequestQuery";
import { RefundStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useUpdateRefundRequestMutation } from "./mutations/Refund/useUpdateRefundRequestMutation";
import { toast } from "sonner";
export const useRefundAction = ({
  page,
  limit,
  status,
  hasToken,
  id,
}: {
  hasToken?: boolean;
  page?: number;
  limit?: number;
  status?: RefundStatus;
  id?: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetAllRefundRequestQuery({
    page,
    limit,
    status,
  });
  const getAllRefundRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/auth/login");
    }
    refetch();
  }, [hasToken, router, refetch]);
  const {
    data: detailData,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useGetDetailRefundRequestQuery({ id: id || "" });
  const getDetailRefundRequest = useCallback(() => {
    if (!hasToken) {
      router.push("/auth/login");
    }
    refetchDetail();
  }, [hasToken, router, refetchDetail]);
  const useUpdateRefundRequest = useUpdateRefundRequestMutation(id || "");
  const updateRefundRequest = useCallback(
    async (data: Parameters<typeof useUpdateRefundRequest.mutateAsync>[0]) => {
      if (!hasToken) {
        router.push("/auth/login");
        return;
      }
      await useUpdateRefundRequest.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Cập nhật yêu cầu hoàn tiền thành công");
          queryClient.invalidateQueries({
            queryKey: ["refundRequests", page, limit, status ],
          });
          queryClient.invalidateQueries({ 
            queryKey: ["refundRequests", id],
            refetchType: "active"
          });
          refetchDetail();
        },
        onError: (error) => {
          console.log(error);
        },
      });
    },
    [hasToken, router, useUpdateRefundRequest, queryClient, id, limit , page ,status, refetchDetail]
  );
  return {
    response: data?.data,
    isLoading,
    isError,
    getAllRefundRequest,
    getDetailRefundRequest,
    detailResponse: detailData?.result,
    isDetailLoading,
    pagination: data?.pagination,
    refetch,
    updateRefundRequest,
  };
};
