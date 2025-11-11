import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type {
  CreateFixedSlotTemplatePayload,
  FixedSlotTemplateDetail,
  FixedSlotTemplateListParams,
  FixedSlotTemplateListResponse,
  UpdateFixedSlotTemplatePayload,
} from "@/types/fixed-slot-types";

const FIXED_SLOT_BASE = "/fixed-slots";

const FIXED_SLOT_ENDPOINTS = {
  BASE: FIXED_SLOT_BASE,
  DETAIL: (id: string) => `${FIXED_SLOT_BASE}/${id}`,
  PAUSE: (id: string) => `${FIXED_SLOT_BASE}/${id}/pause`,
  RESUME: (id: string) => `${FIXED_SLOT_BASE}/${id}/resume`,
  CANCEL: (id: string) => `${FIXED_SLOT_BASE}/${id}/cancel`,
} as const;

type MessageResponse<T = undefined> = {
  message: string;
  result?: T;
};

export const fixedSlotService = {
  getList: async (
    params: FixedSlotTemplateListParams = {},
  ): Promise<AxiosResponse<FixedSlotTemplateListResponse>> => {
    return fetchHttpClient.get<FixedSlotTemplateListResponse>(
      FIXED_SLOT_ENDPOINTS.BASE,
      params,
    );
  },

  getDetail: async (
    id: string,
  ): Promise<AxiosResponse<MessageResponse<FixedSlotTemplateDetail>>> => {
    return fetchHttpClient.get<MessageResponse<FixedSlotTemplateDetail>>(
      FIXED_SLOT_ENDPOINTS.DETAIL(id),
    );
  },

  create: async (
    payload: CreateFixedSlotTemplatePayload,
  ): Promise<AxiosResponse<MessageResponse<FixedSlotTemplateDetail>>> => {
    return fetchHttpClient.post<MessageResponse<FixedSlotTemplateDetail>>(
      FIXED_SLOT_ENDPOINTS.BASE,
      payload,
    );
  },

  update: async (
    id: string,
    payload: UpdateFixedSlotTemplatePayload,
  ): Promise<AxiosResponse<MessageResponse<FixedSlotTemplateDetail>>> => {
    return fetchHttpClient.patch<MessageResponse<FixedSlotTemplateDetail>>(
      FIXED_SLOT_ENDPOINTS.DETAIL(id),
      payload,
    );
  },

  pause: async (
    id: string,
  ): Promise<AxiosResponse<MessageResponse<FixedSlotTemplateDetail>>> => {
    return fetchHttpClient.post<MessageResponse<FixedSlotTemplateDetail>>(
      FIXED_SLOT_ENDPOINTS.PAUSE(id),
    );
  },

  resume: async (
    id: string,
  ): Promise<AxiosResponse<MessageResponse<FixedSlotTemplateDetail>>> => {
    return fetchHttpClient.post<MessageResponse<FixedSlotTemplateDetail>>(
      FIXED_SLOT_ENDPOINTS.RESUME(id),
    );
  },

  cancel: async (
    id: string,
  ): Promise<AxiosResponse<MessageResponse<FixedSlotTemplateDetail>>> => {
    return fetchHttpClient.post<MessageResponse<FixedSlotTemplateDetail>>(
      FIXED_SLOT_ENDPOINTS.CANCEL(id),
    );
  },
};
