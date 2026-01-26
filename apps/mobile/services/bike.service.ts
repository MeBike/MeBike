import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

export const bikeService = {
  // for user
  reportBrokenBike: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.patch(`/bikes/report-broken/${id}`);
    return response;
  },
};
