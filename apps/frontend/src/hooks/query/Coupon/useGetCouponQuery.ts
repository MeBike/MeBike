import { useQuery } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";
import { HTTP_STATUS } from "@constants";
const getCoupon = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await couponService.getCoupons({
      page: page,
      pageSize: pageSize,
    });
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch coupon");
  }
};
export const useGetCoupons = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["data", "coupons"],
    queryFn: () => getCoupon({ page: page, pageSize: pageSize }),
    enabled: false,
  });
};
