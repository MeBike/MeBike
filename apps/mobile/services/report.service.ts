import type { AxiosResponse } from "axios";

import fetchHttpClient from "../lib/httpClient";

type ApiResponse<T> = {
  data: T;
  pagination?: {
    totalPages: number;
    totalRecords: number;
    limit: number;
    currentPage: number;
  };
};

interface DetailApiResponse<T> {
  result: T;
  message: string;
}

import type { ImagePickerAsset } from "expo-image-picker";

export type CreateReportData = {
  bike_id?: string;
  station_id?: string;
  rental_id?: string;
  location?: string;
  type: string;
  message: string;
  media_urls?: ImagePickerAsset[];
};

export type Report = {
  _id: string;
  user_id: string;
  bike_id?: string;
  station_id?: string;
  rental_id?: string;
  assignee_id?: string;
  media_urls: string[];
  location?: string;
  priority: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const REPORT_BASE = "/reports";
const REPORT_ENDPOINTS = {
  BASE: REPORT_BASE,
  BY_ID: (id: string) => `${REPORT_BASE}/${id}`,
} as const;

export const reportService = {
  createReport: async (data: CreateReportData): Promise<AxiosResponse> => {
    const formData = new FormData();

    // Add text fields
    if (data.type) formData.append('type', data.type);
    if (data.message) formData.append('message', data.message);
    const typesRequireBikeId = ["XE HƯ HỎNG", "XE BẨN"];
    if (typesRequireBikeId.includes(data.type) && data.bike_id) {
      formData.append("bike_id", data.bike_id);
    }
    if (data.station_id) formData.append('station_id', data.station_id);
    if (data.rental_id) formData.append('rental_id', data.rental_id);
    if (data.location) formData.append('location', data.location);

    // Add image files
    if (data.media_urls && data.media_urls.length > 0) {
      data.media_urls.forEach((image, index) => {
         formData.append('files', {
         uri: image.uri,
          type: image.type || 'image/jpeg',
         name: image.fileName || `image-${index}.jpg`,
         } as any);
        // formData.append("files", image.uri); // Một số API chỉ nhận chuỗi URI và tự fetch lại file từ client
      });
    }
    console.log(formData);
    const response = await fetchHttpClient.post(REPORT_ENDPOINTS.BASE, formData);
    return response;
  },

  getUserReports: async (): Promise<AxiosResponse<ApiResponse<Report[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Report[]>>(
      REPORT_ENDPOINTS.BASE
    );
    return response;
  },

  getReportById: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<Report>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Report>>(
      REPORT_ENDPOINTS.BY_ID(id)
    );
    return response;
  },
};