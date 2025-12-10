import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAllRefundRequestQuery } from "./query/Refund/useGetAllRefundRequestQuery";
import { useGetDetailRefundRequestQuery } from "./query/Refund/useGetDetailRefundRequestQuery";
import { RefundStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useUpdateRefundRequestMutation } from "./mutations/Refund/useUpdateRefundRequestMutation";
import { toast } from "sonner";
import { useGetRefundOverview } from "./query/Refund/useGetRefundOverview";
import { QUERY_KEYS , HTTP_STATUS , MESSAGE } from "@constants/index";
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
          toast.success(MESSAGE.UPDATE_REFUND_REQUEST_SUCCESS);
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.REFUND.ALL_REFUND_REQUESTS(),
          });
          queryClient.invalidateQueries({ 
            queryKey: QUERY_KEYS.REFUND.DETAIL_REFUND_REQUEST(id || ""),
            refetchType: "active"
          });
          refetchDetail();
        },
        onError: (error) => {
          console.log(error + MESSAGE.UPDATE_REFUND_REQUEST_FAILED);
        },
      });
    },
    [hasToken, router, useUpdateRefundRequest, queryClient, id, limit , page ,status, refetchDetail]
  );
  const { data: overviewResponse } = useGetRefundOverview();
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
    overviewResponse,
    updateRefundRequest,
  };
};
