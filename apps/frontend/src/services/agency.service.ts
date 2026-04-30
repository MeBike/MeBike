import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse , Station , Bike , BikeStatus , Reservation , DetailReservation,RentalRecord,Rental,RentalStatus, ReservationStatus} from "@/types";
import type { Agency, AgencyStats, AgencyRequest } from "@/types/Agency";
import { UpdateAgencyFormData, UpdateAgencyStatusFormData , RegisterAgencyFormData , AdminCreateAgencyUserRequest } from "@/schemas";
export const agencyService = {
  getAgencies: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Agency[]>>> => {
    const response = fetchHttpClient.get<ApiResponse<Agency[]>>(
      ENDPOINT.AGENCY.BASE,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getDetailAgency: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.get<Agency>(ENDPOINT.AGENCY.ID(id));
    return response;
  },
  getAgencyStats: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyStats>> => {
    const response = fetchHttpClient.get<AgencyStats>(
      ENDPOINT.AGENCY.STATS(id),
    );
    return response;
  },
  updateAgencyStatus: async ({
    id,
    data,
  }: {
    id: string;
    data: UpdateAgencyStatusFormData;
  }): Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.patch<Agency>(
      ENDPOINT.AGENCY.STATUS(id),
      data,
    );
    return response;
  },
  updateAgency: async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<UpdateAgencyFormData>;
  }): Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.patch<Agency>(
      ENDPOINT.AGENCY.ID(id),
      data,
    );
    return response;
  },
  getAgencyRequest: async ({
    page,
    pageSize,
    requesterUserId,
    status,
    requesterEmail,
    agencyName,
  }: {
    page?: number;
    pageSize?: number;
    requesterUserId?: string;
    status?: string;
    requesterEmail?: string;
    agencyName?: string;
  }): Promise<AxiosResponse<ApiResponse<AgencyRequest[]>>> => {
    const response = fetchHttpClient.get<ApiResponse<AgencyRequest[]>>(
      ENDPOINT.AGENCY_REQUEST.BASE,
      {
        page : page,
        pageSize : pageSize,
        requesterUserId : requesterUserId,
        status : status,
        requesterEmail : requesterEmail,
        agencyName : agencyName,
      },
    );
    return response;
  },
  getAgencyRequestDetail: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = fetchHttpClient.get<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.ID(id),
    );
    return response;
  },
  approveAgencyRequest: async ({
    id,
    description,
  }: {
    id: string;
    description?: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = await fetchHttpClient.post<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.APPROVE(id),
      description ? { description } : {},
    );
    return response;
  },
  rejectAgencyRequest: async ({
    id,
    description,
    reason,
  }: {
    id: string;
    description?: string;
    reason?: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const payload = {
      ...(description && { description }),
      ...(reason && { reason }),
    };
    const response = await fetchHttpClient.post<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.REJECT(id),
      payload,
    );
    return response;
  },
  cancelAgencyRequest: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = await fetchHttpClient.post<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.CANCEL(id),
    );
    return response;
  },
  registerAgency : async({data}:{data:RegisterAgencyFormData}) : Promise<AxiosResponse<AgencyRequest>> => {
    const response = await fetchHttpClient.post<AgencyRequest>(ENDPOINT.AGENCY_REQUEST.CREATE,data);
    return response
  },
  adminCreateAgency : async({data}:{data:Partial<AdminCreateAgencyUserRequest>}) => {
    const response = await fetchHttpClient.post<Agency>(ENDPOINT.USER.CREATE_USER,data);
    return response
  },
  getMyAgencyRequest: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<AgencyRequest[]>>> => {
    const response = fetchHttpClient.get<ApiResponse<AgencyRequest[]>>(
      ENDPOINT.AGENCY.MY_AGENCY,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },  
  getMyAgencyRequestDetail: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = fetchHttpClient.get<AgencyRequest>(
      ENDPOINT.AGENCY.MY_DETAIL_AGENCY(id),
    );
    return response;
  },
  getMyStations : async ({
    page,
    pageSize,
    name,
    address,
    latitude,
    longitude,
    sortBy,
    sortDir,   
  }: {
    page?: number;
    pageSize?: number;
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    sortBy?: "name" | "capacity" | "updatedAt";
    sortDir?: "asc" | "desc";
  }): Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      ENDPOINT.AGENCY.STATION,
      {
        page,
        pageSize,
        name,
        address,
        latitude,
        longitude,
        sortBy,
        sortDir,
      }
    );
    return response;
  },
  getMyStationDetail: async (
    stationId: string
  ): Promise<AxiosResponse<Station>> => {
    const response = await fetchHttpClient.get<Station>(
      ENDPOINT.AGENCY.STATION_DETAIL(stationId)
    );
    return response;
  },
  getBikeInMyStation: async ({
    id,
    page,
    pageSize,
    stationId,
    supplierId,
    status,
  }: {
    id?: string;
    page?: number;
    pageSize?: number;
    stationId?: string;
    supplierId?: string;
    status?: BikeStatus;
  }): Promise<AxiosResponse<ApiResponse<Bike[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Bike[]>>(
      ENDPOINT.AGENCY.BIKE,
      {
        id : id,
        page : page,
        pageSize : pageSize,
        stationId : stationId,
        supplierId : supplierId,
        status : status,
      }
    );
    return response;
  },
  getBikeDetailInMyStation: async (
    id: string
  ): Promise<AxiosResponse<Bike>> => {
    const response = await fetchHttpClient.get<Bike>(
      ENDPOINT.AGENCY.BIKE_DETAIL(id)
    );
    return response;
  },
    getReservationInMyStation: async ({
    page,
    pageSize,
    status,
    option,
  }: {
    page?: number;
    pageSize?: number;
    status ?: ReservationStatus;
    option ?: "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION";
  }): Promise<AxiosResponse<ApiResponse<Reservation[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      ENDPOINT.AGENCY.RESERVATION,
      {
        page : page,
        pageSize : pageSize,
        status : status,
        reservationOption : option,
      },
    );
    return response;
  },
  getReservationDetailInMyStation: async (
    id: string,
  ): Promise<AxiosResponse<DetailReservation>> => {
    const response = await fetchHttpClient.get<DetailReservation>(
      ENDPOINT.AGENCY.RESERVATION_DETAIL(id),
    );
    return response;
  },
    getRentalInMyStation: async ({
    page,
    pageSize,
    startStation,
    endStation,
    status,
    userId,
    bikeId,
  }: {
    page ?: number,
    pageSize ?: number,
    startStation ?: string,
    endStation ?: string,
    status ?: RentalStatus,
    userId ?: string,
    bikeId ?: string,
  }): Promise<
    AxiosResponse<ApiResponse<Rental[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Rental[]>>(
      ENDPOINT.AGENCY.RENTAL,
      {
        page : page,
        pageSize : pageSize,
        startStation : startStation,
        endStation : endStation,
        status : status,
        userId : userId,
        bikeId : bikeId
      }
    );
    return response;
  },
  getRentalDetailInMyStation: async (
    id: string
  ): Promise<AxiosResponse<RentalRecord>> => {
    const response = await fetchHttpClient.get<RentalRecord>(
      ENDPOINT.AGENCY.RENTAL_DETAIL(id)
    );
    return response;
  },
  updateBikeStatus : async({id,status}:{
    id:string,
    status:"AVAILABLE" | "BROKEN"
  }) => {
    const response = await fetchHttpClient.patch(ENDPOINT.AGENCY.AGENCY_UPDATE_BIKE_STATUS(id),{
      status : status
    });
    return response;
  }
  
};
