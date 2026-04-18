import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback } from "react";
import {} from "@mutations";
import {
  useGetCouponStats,
  useGetCoupons,
  useGetUsageCouponLog,
} from "@queries";
import { useRouter } from "next/navigation";
import { HTTP_STATUS } from "@constants";
import {
  getErrorMessageFromCouponCode,
  getAxiosErrorCodeMessage,
} from "@utils";

interface CouponActionProps {
  hasToken: boolean;
  id?: string;
  page?: number;
  pageSize?: number;
}

export const useCoupon = ({
  hasToken,
  id,
  page,
  pageSize,
}: CouponActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: dataCoupons,
    isLoading: isLoadingCoupons,
    refetch: refetchCoupons,
  } = useGetCoupons({ page, pageSize });
  const getCoupons = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchCoupons();
  }, [hasToken, router, refetchCoupons, page, pageSize]);
  const {
    data: dataCouponStats,
    isLoading: isLoadingCouponStats,
    refetch: refetchCouponStats,
  } = useGetCouponStats({ page, pageSize });
  const {
    data: dataUsageCouponLog,
    isLoading: isLoadingUsageCouponLog,
    refetch: refetchUsageCouponLog,
  } = useGetUsageCouponLog({ page, pageSize });
  const getCouponStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchCouponStats();
  }, [hasToken, router, refetchCouponStats, page, pageSize]);
  const getUsageCouponLog = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchUsageCouponLog();
  }, [hasToken, router, refetchUsageCouponLog, page, pageSize]);
  return {
    dataCoupons,
    isLoadingCoupons,
    refetchCoupons,
    dataCouponStats,
    isLoadingCouponStats,
    refetchCouponStats,
    dataUsageCouponLog,
    isLoadingUsageCouponLog,
    refetchUsageCouponLog,
    getCoupons,
    getCouponStats,
    getUsageCouponLog,
  };
};
