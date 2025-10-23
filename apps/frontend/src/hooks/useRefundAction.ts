import { useQueryClient } from "@tanstack/react-query";
import { useGetAllRefundRequestQuery } from "./query/Refund/useGetAllRefundRequestQuery";
import { RefundStatus } from "@/types";
export const useRefundAction = ({ page, limit, status , hasToken}: {
    hasToken?: boolean,
    page?: number,
    limit?: number,
    status?: RefundStatus
}) => {
    const queryClient = useQueryClient();
    const { data, isLoading, isError , refetch} = useGetAllRefundRequestQuery({ page, limit, status });
    return {
        response : data?.data,
        isLoading,
        isError,
        refetch
    };
};
