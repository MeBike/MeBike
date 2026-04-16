import fetchHttpClient from "@/lib/httpClient";
import type { Subscription } from "@/types";
import { ENDPOINT } from "@/constants";
import { ApiResponse } from "@/types";
import { AxiosResponse } from "axios";
export const subscriptionSerive = {
  getSubscription: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Subscription[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Subscription[]>>(
      ENDPOINT.SUBSCRIPTION.BASE,
      {
        page: page ?? 1,
        pageSize: pageSize ?? 7,
      },
    );
    return response;
  },
  getDetalSubscription: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<Subscription>> => {
    const response = await fetchHttpClient.get<Subscription>(
      ENDPOINT.SUBSCRIPTION.ID(id),
    );
    return response;
  },
};
