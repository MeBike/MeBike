import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {toast} from "sonner";
import {
    useGetAdminViewDistributionRequestQuery,
    useGetStaffViewDistributionRequestQuery,
    useGetAgencyViewDistributionRequestQuery,
    useGetManagerViewDistributionRequestQuery
} from "@queries"
import { useRouter } from "next/navigation";
import { HTTP_STATUS } from "@/constants";