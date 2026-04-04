import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { Rating } from "@/types";
import { ApiResponse } from "@/types";
import { ENDPOINT } from "@/constants";
export const ratingService = {
  getAllRatings: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Rating[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Rating[]>>(
      ENDPOINT.RATING.BASE,
      {
        page : page,
        pageSize : pageSize,
      }
    );
    return response;
  },

  getRatingDetail: async (ratingId: string): Promise<AxiosResponse<Rating>> => {
    const response = await fetchHttpClient.get<Rating>(
      ENDPOINT.RATING.ID(ratingId)
    );
    return response;
  },
};