import type { AxiosResponse } from "axios";

import fetchHttpClient from "../lib/httpClient";
import { uploadMultipleImagesToFirebase } from "../lib/imageUpload";

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
  latitude?: number;
  longitude?: number;
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
    let mediaUrls: string[] = [];

    // Upload images to Firebase first if any
    if (data.media_urls && data.media_urls.length > 0) {
      try {
        mediaUrls = await uploadMultipleImagesToFirebase(data.media_urls);
      } catch (error) {
        console.error('Failed to upload images to Firebase:', error);
        throw new Error('Failed to upload images');
      }
    }

    // Prepare JSON payload
    const payload = {
      type: data.type,
      message: data.message,
      bike_id: data.bike_id,
      station_id: data.station_id,
      rental_id: data.rental_id,
      location: data.location,
      files: mediaUrls.length > 0 ? mediaUrls : undefined,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    console.log('Report payload:', payload);
    const response = await fetchHttpClient.post(REPORT_ENDPOINTS.BASE, payload);
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