import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type {
  CreateRatingPayload,
  RatingReason,
} from "../types/RatingTypes";

const RATING_BASE = "/ratings";

export type RatingReasonsResponse = {
  message: string;
  result: RatingReason[];
};

export const ratingService = {
  getRatingReasons: async (
    params?: Partial<{ type: string; applies_to: string }>,
  ): Promise<AxiosResponse<RatingReasonsResponse>> => {
    return fetchHttpClient.get(`${RATING_BASE}/rating-reasons`, params);
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
