import { useQuery } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";
import { HTTP_STATUS } from "@constants";
const getCouponStats = async () => {
  try {
    const response = await couponService.getCouponStats();
    if (response.status === HTTP_STATUS.OK) {
        return response.data
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch coupon");
  }
};
export const useGetCouponStats = () => {
    return useQuery({
        queryKey:["data","coupon-stats"],
        queryFn : () => getCouponStats(),
        enabled:false,
    })
}
