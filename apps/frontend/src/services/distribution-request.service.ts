import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import { CreateRedistributionRequestInput } from "@/schemas/distribution-request-schema";
import type {
  RedistributionRequest,
  RedistributionRequestDetail,
  RedistributionRequestStatus,
  RedistributionRequestDetailForApprove
} from "@/types/DistributionRequest";
export const distributionRequestService = {
  getAdminViewDistributionRequest: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status?: RedistributionRequestStatus;
  }): Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>> => {
    const response = await fetchHttpClient.get<
      ApiResponse<RedistributionRequest[]>
    >(ENDPOINT.DISTRIBUTION_REQUEST.ADMIN_VIEW, {
      page: page,
      pageSize: pageSize,
      status: status,
    });
    return response;
  },
  getAdminViewDistributionRequestDetail: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<RedistributionRequestDetail>> => {
    const response = await fetchHttpClient.get<RedistributionRequestDetail>(
      ENDPOINT.DISTRIBUTION_REQUEST.DETAIL_ADMIN_VIEW(id),
    );
    return response;
  },
  getManagerViewDistributionRequest: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status?: RedistributionRequestStatus;
  }) : Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<RedistributionRequest[]>>(
      ENDPOINT.DISTRIBUTION_REQUEST.MANAGER_VIEW,
      {
        page : page,
        pageSize : pageSize,
        status : status
      }
    );
    return response;
  },
  getManagerViewDistributionRequestHistory: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status: RedistributionRequestStatus;
  }) : Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<RedistributionRequest[]>>(
      ENDPOINT.DISTRIBUTION_REQUEST.MANAGER_VIEW_HISTORY,
      {
        page : page,
        pageSize : pageSize,
        status : status
      }
    );
    return response;
  },
  getManagerViewDistributionRequestDetail: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetail>>=> {
    const response = await fetchHttpClient.get<RedistributionRequestDetail>(
      ENDPOINT.DISTRIBUTION_REQUEST.MANAGER_VIEW_DETAIL(id),
    );
    return response;
  },
  getAgencyViewDistributionRequest: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status?: RedistributionRequestStatus;
  }) : Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>>=> {
    const response = await fetchHttpClient.get<ApiResponse<RedistributionRequest[]>>(
      ENDPOINT.DISTRIBUTION_REQUEST.AGENCY_VIEW,
      {
        page : page,
        pageSize : pageSize,
        status : status
      }
    );
    return response;
  },
  getAgencyViewDistributionRequestDetail: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetail>>=> {
    const response = await fetchHttpClient.get<RedistributionRequestDetail>(
      ENDPOINT.DISTRIBUTION_REQUEST.AGENCY_VIEW_DETAIL(id),
    );
    return response;
  },
  getAgencyViewDistributionRequestHistory: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status: RedistributionRequestStatus;
  }) : Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>>=> {
    const response = await fetchHttpClient.get<ApiResponse<RedistributionRequest[]>>(
      ENDPOINT.DISTRIBUTION_REQUEST.AGENCY_VIEW_HISTORY,
      {
        page : page,
        pageSize : pageSize,
        status : status
      }
    );
    return response;
  },
  getStaffViewDistributionRequest: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status?: RedistributionRequestStatus;
  }) : Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<RedistributionRequest[]>>(
      ENDPOINT.DISTRIBUTION_REQUEST.STAFF_VIEW,
      {
        page : page,
        pageSize : pageSize,
        status : status,
      }
    );
    return response;
  },
  getStaffViewDistributionRequestDetail: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetail>>=> {
    const response = await fetchHttpClient.get<RedistributionRequestDetail>(
      ENDPOINT.DISTRIBUTION_REQUEST.STAFF_VIEW_DETAIL(id),
    );
    return response;
  },
  getStaffViewDistributionRequestHistory: async ({
    page,
    pageSize,
    status,
  }: {
    page?: number;
    pageSize?: number;
    status: RedistributionRequestStatus;
  }) : Promise<AxiosResponse<ApiResponse<RedistributionRequest[]>>>=> {
    const response = await fetchHttpClient.get<ApiResponse<RedistributionRequest[]>>(
      ENDPOINT.DISTRIBUTION_REQUEST.STAFF_VIEW_HISTORY,
      {
        page : page,
        pageSize : pageSize,
        status : status
      }
    );
    return response;
  },
  approveDistributionRequest: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetailForApprove>> => {
    const response = await fetchHttpClient.post<RedistributionRequestDetailForApprove>(
      ENDPOINT.DISTRIBUTION_REQUEST.APPROVE(id),
    );
    return response;
  },
  rejectDistributionRequest: async ({ id , data  }: { id: string , data : {reason : string} }) : Promise<AxiosResponse<RedistributionRequestDetailForApprove>> => {
    const response = await fetchHttpClient.post<RedistributionRequestDetailForApprove>(
      ENDPOINT.DISTRIBUTION_REQUEST.REJECT(id),
      data
    );
    return response;
  },
  confirmCompletionDistributionRequest: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetailForApprove>> => {
    const response = await fetchHttpClient.post<RedistributionRequestDetailForApprove>(
      ENDPOINT.DISTRIBUTION_REQUEST.CONFIRM_COMPLETION(id),
    );
    return response;
  },
  cancelDistributionRequest: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetailForApprove>> => {
    const response = await fetchHttpClient.post<RedistributionRequestDetailForApprove>(
      ENDPOINT.DISTRIBUTION_REQUEST.CANCEL_DISTRIBUTION_REQUEST(id),
    );
    return response;
  },
  startTransitDistributionRequest: async ({ id }: { id: string }) : Promise<AxiosResponse<RedistributionRequestDetailForApprove>> => {
    const response = await fetchHttpClient.post<RedistributionRequestDetailForApprove>(
      ENDPOINT.DISTRIBUTION_REQUEST.START_TRANSIT(id),
    );
    return response;
  },
  createDistributionRequest: async ({
    data,
  }: {
    data: CreateRedistributionRequestInput;
  })  : Promise<AxiosResponse<RedistributionRequestDetailForApprove>>=> {
    const response = await fetchHttpClient.post<RedistributionRequestDetailForApprove>(
      ENDPOINT.DISTRIBUTION_REQUEST.CREATE_DISTRIBUTION_REQUEST,
      data,
    );
    return response;
  },
};
