import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { Rating } from "@/types";
import { ApiResponse } from "@/types";
export const ratingService = {
  getAllRatings: async ({
    page = 1,
    limit = 10,
  }: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<Rating[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Rating[]>>(
      RATING_BASE,
      {
        page,
        limit,
      }
    );
    return response;
  },

  getRatingDetail: async (ratingId: string): Promise<AxiosResponse<DetailApiResponse<Rating>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Rating>>(
      `${RATING_BASE}/detail/${ratingId}`
    );
    return response;
  },
};