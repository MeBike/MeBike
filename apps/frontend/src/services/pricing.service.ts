import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";
import { CreatePricingPolicyFormData , UpdatePricingPolicyFormData } from "@/schemas/pricing-schema";
import type {
  PricingPolicyStatus,
  PricingPolicy,
  PricingPolicyDetail,
} from "@/types";
import { ENDPOINT } from "@/constants/end-point";
import { ApiResponse, DetailApiResponse } from "@/types";
export const pricingService = {
  getListPricingPolicy: async ({
    page,
    pageSize,
    name,
    status,
  }: {
    page?: number;
    pageSize?: number;
    name?: string;
    status?: PricingPolicyStatus;
  }): Promise<AxiosResponse<ApiResponse<PricingPolicy[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<PricingPolicy[]>>(
      ENDPOINT.PRICING_POLICY.BASE,
      {
        page,
        pageSize,
        name,
        status,
      },
    );
    return response;
  },
  getPricingPolicyDetail: async (
    pricingPolicyId: string
  ): Promise<AxiosResponse<PricingPolicyDetail>> => {
    const response = await fetchHttpClient.get<PricingPolicyDetail>(
      ENDPOINT.PRICING_POLICY.ID(pricingPolicyId)
    );
    return response;
  },
  activePricingPolicy: async (
    pricingPolicyId: string
  ): Promise<AxiosResponse<PricingPolicyDetail>> => {
    const response = await fetchHttpClient.patch<PricingPolicyDetail>(
      ENDPOINT.PRICING_POLICY.ACTIVE_PRICING_POLICY(pricingPolicyId)
    );
    return response;
  },
  createPricingPolicy: async (
    pricingPolicyData: CreatePricingPolicyFormData
  ): Promise<AxiosResponse<DetailApiResponse<PricingPolicy>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<PricingPolicy>>(
      ENDPOINT.PRICING_POLICY.BASE,
      pricingPolicyData
    );
    return response;
  },
  updatePricingPolicy: async (
    pricingPolicyId: string,
    pricingPolicyData: UpdatePricingPolicyFormData
  ): Promise<AxiosResponse<DetailApiResponse<PricingPolicy>>> => {
    const response = await fetchHttpClient.patch<DetailApiResponse<PricingPolicy>>(
      ENDPOINT.PRICING_POLICY.ID(pricingPolicyId),
      pricingPolicyData
    );
    return response;
  },
};
