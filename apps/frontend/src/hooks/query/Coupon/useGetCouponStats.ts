import { useQuery } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";
import { HTTP_STATUS } from "@constants";
const getCouponStats = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await couponService.getCouponStats({
      page: page,
      pageSize: pageSize,
    });
    if (response.status === HTTP_STATUS.OK) {
        return response.data
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch coupon");
  }
};
export const useGetCouponStats = ({page,pageSize}:{page?:number,pageSize?:number}) => {
    return useQuery({
        queryKey:["data","coupon-stats"],
        queryFn : () => getCouponStats({page:page,pageSize:pageSize}),
        enabled:false,
    })
}
