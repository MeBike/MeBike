import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { Rating } from "@/types";

interface ApiResponse<T> {
  data: T;
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
  message: string;
}

interface DetailApiResponse<T> {
  result: T;
  message: string;
}

const RATING_BASE = "/ratings";

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
};