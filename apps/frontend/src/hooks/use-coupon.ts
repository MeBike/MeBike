import { CreateCouponRuleData } from "./../../../server/src/domain/coupons/models";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback } from "react";
import { useCreateCouponMutation,useActiveCouponMutation,useDeactiveCouponMutation} from "@mutations";
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
import { CreateAdminCouponRuleBody } from "@/schemas/coupon-schema";

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
  } = useGetCouponStats();
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
  const useCreateCoupon = useCreateCouponMutation();
  const useActiveCoupon = useActiveCouponMutation();
  const useDeactiveCoupon = useDeactiveCouponMutation();
  const createCoupon = useCallback(
    async (data: CreateAdminCouponRuleBody) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateCoupon.mutateAsync(data);
        if (result.status === HTTP_STATUS.CREATED) {
          toast.success("Tạo coupon thành công");
          queryClient.invalidateQueries({
            queryKey: ["data", "coupons"],
          });
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromCouponCode(error_code));
        throw error;
      }
    },
    [useCreateCoupon, hasToken, router, page, pageSize, queryClient],
  );
  const activeCoupon = useCallback(
    async (id:string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useActiveCoupon.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Active coupon thành công");
          getCoupons();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromCouponCode(error_code));
        throw error;
      }
    },
    [useCreateCoupon, hasToken, router, page, pageSize, queryClient],
  );
  const deactiveCoupon = useCallback(
    async (id:string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useDeactiveCoupon.mutateAsync(id);
        if (result.status === HTTP_STATUS.OK) {
          toast.success("Deactive coupon thành công");
          // queryClient.invalidateQueries({
          //   queryKey: ["data", "coupons"],
          // });
          getCoupons();
        }
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        toast.error(getErrorMessageFromCouponCode(error_code));
        throw error;
      }
    },
    [useCreateCoupon, hasToken, router, page, pageSize, queryClient],
  );
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
    createCoupon,
    activeCoupon,
    deactiveCoupon,
  };
};
