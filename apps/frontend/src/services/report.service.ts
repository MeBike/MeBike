import type { AxiosResponse } from "axios";
import fetchHttpClient from "../lib/httpClient";
import type { Report, ReportOverview } from "@custom-types";
import {
  type ResolveReportSchemaFormData ,
  type UpdateReportSchemaFormData,
} from "@/schemas/reportSchema";
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
  OVERVIEW: `${REPORT_BASE}/overview`,
  INPROGRESS: `${REPORT_BASE}/inprogress`,
  RESOLVE: (id: string) => `${REPORT_BASE}/staff/${id}`,
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
  getManageUserReports: async ({
    page , limit
  } : {page ?: number , limit ?: number}): Promise<
    AxiosResponse<ApiResponse<Report[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Report[]>>(
      REPORT_ENDPOINTS.MANAGE_USER_REPORTS,
      {
        page,
        limit
      }
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
  updateReport: async (
    id: string,
    data: UpdateReportSchemaFormData
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(REPORT_ENDPOINTS.BY_ID(id), data);
    return response;
  },
  getReportInProgress : async({page,limit} : {page : number , limit : number}) : Promise<AxiosResponse<ApiResponse<Report[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Report[]>>(
      REPORT_ENDPOINTS.INPROGRESS ,
      {
        page : page ,
        limit : limit,
      }
    );
    return response;
  },
  resolveReport : async({id,data} : {id:string, data : ResolveReportSchemaFormData }) : Promise<AxiosResponse<DetailApiResponse<Report>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Report>>(
      REPORT_ENDPOINTS.RESOLVE(id) , data
    );
    return response
  }
};
