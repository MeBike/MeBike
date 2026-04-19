import { useQuery } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";
import { HTTP_STATUS } from "@constants";
const getUsageCouponLog = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await couponService.getUsageCouponLog({
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
export const useGetUsageCouponLog = ({page,pageSize}:{page?:number,pageSize?:number}) => {
    return useQuery({
        queryKey:["data","coupon-usage-log"],
        queryFn : () => getUsageCouponLog({page:page,pageSize:pageSize}),
        enabled:false,
    })
}
