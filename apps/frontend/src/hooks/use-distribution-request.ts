import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import {toast} from "sonner";
import {
    useGetAdminViewDistributionRequestQuery,
    useGetStaffViewDistributionRequestQuery,
    useGetAgencyViewDistributionRequestQuery,
    useGetManagerViewDistributionRequestQuery
} from "@queries"
import { useRouter } from "next/navigation";
import { HTTP_STATUS } from "@/constants";
interface DistributionRequestActionProps {
    page ?: number;
    pageSize ?: number;
    status ?: RedistributionRequestStatus;
    id ?: string;
    hasToken : boolean;
}
export const useDistributionRequest = ({
    page,
    pageSize,
    status,
    id,
    hasToken
} : DistributionRequestActionProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const {data : adminViewDistributionRequest, refetch : refetchAdminViewDistributionRequest, isFetching : isFetchingAdminViewDistributionRequest} = useGetAdminViewDistributionRequestQuery({page,pageSize,status});
    const {data : staffViewDistributionRequest, refetch : refetchStaffViewDistributionRequest, isFetching : isFetchingStaffViewDistributionRequest} = useGetStaffViewDistributionRequestQuery({page,pageSize,status});
    const {data : agencyViewDistributionRequest, refetch : refetchAgencyViewDistributionRequest, isFetching : isFetchingAgencyViewDistributionRequest} = useGetAgencyViewDistributionRequestQuery({page,pageSize,status});
    const {data : managerViewDistributionRequest, refetch : refetchManagerViewDistributionRequest, isFetching : isFetchingManagerViewDistributionRequest} = useGetManagerViewDistributionRequestQuery({page,pageSize,status});
    // const getAdminViewDistributionRequest = useCallback(() => {
    //     if(!hasToken){
    //         router.push("/login");
    //         return;
    //     }
    //     refetchAdminViewDistributionRequest();
    // }, [refetchAdminViewDistributionRequest]);
    const getAdminViewDistributionRequest = () => {
        refetchAdminViewDistributionRequest();
    }
    const getStaffViewDistributionRequest = useCallback(() => {
        if(!hasToken){
            router.push("/login");
            return;
        }
        refetchStaffViewDistributionRequest();
    }, [refetchStaffViewDistributionRequest]);
    const getAgencyViewDistributionRequest = useCallback(() => {
        if(!hasToken){
            router.push("/login");
            return;
        }
        refetchAgencyViewDistributionRequest();
    }, [refetchAgencyViewDistributionRequest]);
    const getManagerViewDistributionRequest = useCallback(() => {
        refetchManagerViewDistributionRequest();
    }, [refetchManagerViewDistributionRequest]);
    return {
        adminViewDistributionRequest,
        refetchAdminViewDistributionRequest,
        isFetchingAdminViewDistributionRequest,
        getAdminViewDistributionRequest,
        staffViewDistributionRequest,
        refetchStaffViewDistributionRequest,
        isFetchingStaffViewDistributionRequest,
        getStaffViewDistributionRequest,
        agencyViewDistributionRequest,
        refetchAgencyViewDistributionRequest,
        isFetchingAgencyViewDistributionRequest,
        getAgencyViewDistributionRequest,
        managerViewDistributionRequest,
        refetchManagerViewDistributionRequest,
        isFetchingManagerViewDistributionRequest,
        getManagerViewDistributionRequest,
    }
}