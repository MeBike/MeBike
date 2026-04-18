import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { ENDPOINT } from "@/constants/end-point";
import { ApiResponse } from "@custom-types";
import { Coupon, CouponStat, CouponUsageLog } from "@/types/Coupon";
export const couponService = {
  getCoupons: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Coupon[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Coupon[]>>(
      ENDPOINT.COUPON.BASE,
      { page, pageSize },
    );
    return response;
  },
  createCoupon: async (data: Coupon): Promise<AxiosResponse<Coupon>> => {
    const response = await fetchHttpClient.post<Coupon>(
      ENDPOINT.COUPON.BASE,
      data,
    );
    return response;
  },
  updateCoupon: async (
    id: string,
    data: Coupon,
  ): Promise<AxiosResponse<Coupon>> => {
    const response = await fetchHttpClient.put<Coupon>(
      ENDPOINT.COUPON.UPDATE(id),
      data,
    );
    return response;
  },
  activeCoupon: async (id: string): Promise<AxiosResponse<Coupon>> => {
    const response = await fetchHttpClient.put<Coupon>(
      ENDPOINT.COUPON.ACTIVE(id),
    );
    return response;
  },
  deactiveCoupon: async (id: string): Promise<AxiosResponse<Coupon>> => {
    const response = await fetchHttpClient.put<Coupon>(
      ENDPOINT.COUPON.DEACTIVE(id),
    );
    return response;
  },
  getCouponStats: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<CouponStat[]>> => {
    const response = await fetchHttpClient.get<CouponStat[]>(
      ENDPOINT.COUPON.COUPON_STATS,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getUsageCouponLog: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<CouponUsageLog[]>> => {
    const response = await fetchHttpClient.get<CouponUsageLog[]>(
      ENDPOINT.COUPON.USAGE_COUPON_STATS_LOG,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
};
