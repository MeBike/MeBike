import type { AxiosResponse } from "axios";
import fetchHttpClient from "../lib/httpClient";
import type { Report, ReportOverview } from "@custom-types";
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


const REPORT_BASE = "/reports";
const REPORT_ENDPOINTS = {
  BASE: REPORT_BASE,
  BY_ID: (id: string) => `${REPORT_BASE}/${id}`,
  MANAGE_USER_REPORTS: `${REPORT_BASE}/manage-reports`,
  OVERVIEW : `${REPORT_BASE}/overview`,
} as const;

export const reportService = {
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
  getManageUserReports: async (): Promise<
    AxiosResponse<ApiResponse<Report[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Report[]>>(
      REPORT_ENDPOINTS.MANAGE_USER_REPORTS
    );
    return response;
  },
  updateReportStatus: async (
    id: string,
    status: string
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(REPORT_ENDPOINTS.BY_ID(id), {
      newStatus: status,
    });
    return response;
  },
  getOverview: async (): Promise<
    AxiosResponse<DetailApiResponse<ReportOverview>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<ReportOverview>
    >(REPORT_ENDPOINTS.OVERVIEW);
    return response;
  },
};
