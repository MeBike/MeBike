import { use, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAllRefundRequestQuery } from "./query/Refund/useGetAllRefundRequestQuery";
import { useGetDetailRefundRequestQuery } from "./query/Refund/useGetDetailRefundRequestQuery";
import { RefundStatus } from "@/types";
import { useRouter } from "next/navigation";
export const useRefundAction = ({ page, limit, status , hasToken , id}: {
    hasToken?: boolean,
    page?: number,
    limit?: number,
    status?: RefundStatus
    id?: string
}) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, isLoading, isError , refetch} = useGetAllRefundRequestQuery({ page, limit, status });
    const getAllRefundRequest = useCallback(() => {
        if(!hasToken){
            router.push('/auth/login');
        };
        refetch();
    }, [hasToken, router, refetch ]);
    const { data: detailData , isLoading: isDetailLoading , refetch: refetchDetail } = useGetDetailRefundRequestQuery({ id: id || "" });
    const getDetailRefundRequest = useCallback(() => {  
        if(!hasToken){
            router.push('/auth/login');
        };
        refetchDetail();
    }, [hasToken, router, refetchDetail]);
    return {
        response : data?.data,
        isLoading,
        isError,
        getAllRefundRequest,
        getDetailRefundRequest,
        detailResponse : detailData?.result,
        isDetailLoading,
        pagination : data?.pagination,
        refetch
    };
};
