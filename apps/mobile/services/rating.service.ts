import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type {
  CreateRatingPayload,
  RatingDetail,
  RatingReason,
} from "../types/RatingTypes";

const RATING_BASE = "/ratings";

export type RatingReasonsResponse = {
  message: string;
  result: RatingReason[];
};

export type RatingResponse = {
  message: string;
  result: RatingDetail;
};

export const ratingService = {
  getRatingReasons: async (
    params?: Partial<{ type: string; applies_to: string }>,
  ): Promise<AxiosResponse<RatingReasonsResponse>> => {
    return fetchHttpClient.get(`${RATING_BASE}/rating-reasons`, params);
  },
  getRating: async (
    rentalId: string,
  ): Promise<AxiosResponse<RatingResponse>> => {
    return fetchHttpClient.get(`${RATING_BASE}/${rentalId}`);
  },
  createRating: async (
    rentalId: string,
    payload: CreateRatingPayload,
  ): Promise<
    AxiosResponse<{
      message: string;
    }>
  > => {
    return fetchHttpClient.post(`${RATING_BASE}/${rentalId}`, payload);
  },
};
