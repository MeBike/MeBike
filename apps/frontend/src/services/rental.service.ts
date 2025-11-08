import type { AxiosResponse } from "axios";
import type { RentalSchemaFormData, UpdateRentalSchema } from "@schemas/rentalSchema";
import fetchHttpClient from "@lib/httpClient";
import type { RentingHistory } from "@custom-types";
import { StatwithRevenue } from "@custom-types";
import { DetailRentalReponse , RentalRecord} from "@custom-types";
export type Pagination = {
  limit: number;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
};
export interface GetAllRentalsForStaffAdminProps {
  page?: number;
  limit?: number;
  start_station?: string;
  end_station?: string;
  status?: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY" | "ĐÃ ĐẶT TRƯỚC";
}
interface Dashboardsummary {
  revenueSummary: {
    today: {
      totalRevenue: number;
      totalRentals: number;
    };
    yesterday: {
      totalRevenue: number;
      totalRentals: number;
    };
    revenueChange: number;
    revenueTrend: string;
    rentalChange: number;
    rentalTrend: string;
  };
  hourlyRentalStats: Array<{
    hour: string;
    totalRentals: number;
  }>;
}
const RENTAL_BASE = "/rentals";
const RENTAL_ENDPOINTS = {
  BASE: RENTAL_BASE,
  USER_RENT: () => `${RENTAL_BASE}`,
  USER_RENTAL_ME: () => `${RENTAL_BASE}/me`,
  USER_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/me/${id}`,
  USER_CURRENT_RENTAL: () => `${RENTAL_BASE}/me/current`,
  END_USER_CURRENT_RENTAL: (id: string) => `${RENTAL_BASE}/me/${id}/end`,
  ADMIN_RENTAL_REVENUE: () => `${RENTAL_BASE}/stats/revenue`,
  ADMIN_STATS_STATION_ACTIVITY: () => `${RENTAL_BASE}/stats/station-activity`,
  ADMIN_STATS_RESERVATIONS: () => `${RENTAL_BASE}/stats/reservations`,
  ADMIN_CANCEL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/cancel`,
  STAFF_ADMIN_GET_ALL_RENTALS: () => `${RENTAL_BASE}`,
  STAFF_ADMIN_GET_DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  STAFF_ADMIN_UPDATE_DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  GET_REVENUE: () => `${RENTAL_BASE}/stats/revenue`,
  GET_STATS_STATION_ACTIVITY: () => `${RENTAL_BASE}/stats/station-activity`,
  GET_RESERVATION_STATS: () => `${RENTAL_BASE}/stats/reservations`,
  UPDATE_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/${id}`,
  END_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/end`,
  CANCEL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/cancel`,
  DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  DASHBOARD_RENTAL_STATS: () => `${RENTAL_BASE}/dashboard-summary`,
};
type RentalResponse = {
  data: RentingHistory[];
  pagination: Pagination;
};
interface ApiResponse<T> {
  data: T;
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
  message: string;
}
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
export const rentalService = {
  userPostRent: async (
    data: RentalSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<RentingHistory>>> => {
    const response = await fetchHttpClient.post<
      DetailApiResponse<RentingHistory>
    >(RENTAL_ENDPOINTS.USER_RENT(), data);
    return response;
  },
  userGetAllRentalsForUser: async (
    page: number,
    limit: number
  ): Promise<AxiosResponse<RentalResponse>> => {
    const response = await fetchHttpClient.get<RentalResponse>(
      RENTAL_ENDPOINTS.USER_RENTAL_ME(),
      {
        params: {
          page,
          limit,
        },
      }
    );
    return response;
  },
  userGetCurrentRentals: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.USER_CURRENT_RENTAL()
    );
    return response;
  },
  userPutEndCurrentRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put<AxiosResponse>(
      RENTAL_ENDPOINTS.END_USER_CURRENT_RENTAL(id)
    );
    return response;
  },
  userGetRentalById: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.USER_RENTAL_DETAIL(id)
    );
    return response;
  },
  adminGetRentalRevenue: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.ADMIN_RENTAL_REVENUE()
    );
    return response;
  },
  adminGetStationActivity: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.ADMIN_STATS_STATION_ACTIVITY()
    );
    return response;
  },
  adminGetStatisticReservations: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.ADMIN_STATS_RESERVATIONS()
    );
    return response;
  },
  adminPostCancelRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.post(
      RENTAL_ENDPOINTS.ADMIN_CANCEL_RENTAL(id)
    );
    return response;
  },
  staffAdminGetAllRentals: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.STAFF_ADMIN_GET_ALL_RENTALS()
    );
    return response;
  },
  staffAdminGetDetailRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.STAFF_ADMIN_GET_DETAIL_RENTAL(id)
    );
    return response;
  },
  getAllRentalsForStaffAdmin: async ({
    page,
    limit,
    start_station,
    end_station,
    status,
  }: GetAllRentalsForStaffAdminProps): Promise<
    AxiosResponse<ApiResponse<RentingHistory[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<RentingHistory[]>>(
      RENTAL_ENDPOINTS.STAFF_ADMIN_GET_ALL_RENTALS(),
      {
        page,
        limit,
        start_station,
        end_station,
        status,
      }
    );
    return response;
  },
  getRevenue: async ({
    from,
    to,
    groupBy,
  }: {
    from?: string;
    to?: string;
    groupBy?: "MONTH" | "YEAR" | "DAY";
  }): Promise<AxiosResponse<DetailApiResponse<StatwithRevenue>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<StatwithRevenue>
    >(RENTAL_ENDPOINTS.GET_REVENUE(), {
      from,
      to,
      groupBy,
    });
    return response;
  },
  getDetailRental: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<RentalRecord>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<RentalRecord>
    >(RENTAL_ENDPOINTS.DETAIL_RENTAL(id));
    return response;
  },
  updateDetailRental: async (
    id: string,
    data: UpdateRentalSchema
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(
      RENTAL_ENDPOINTS.UPDATE_RENTAL_DETAIL(id),
      data
    );
    return response;
  },
  getDashboardRentalStats: async (): Promise<
    AxiosResponse<DetailApiResponse<Dashboardsummary>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<Dashboardsummary>
    >(RENTAL_ENDPOINTS.DASHBOARD_RENTAL_STATS());
    return response;
  },
  // staffAdminUpdateDetailRental: async (
  //   id: string,
  //   data: any
  // ): Promise<AxiosResponse> => {
  //   const response = await fetchHttpClient.put(
  //     RENTAL_ENDPOINTS.STAFF_ADMIN_UPDATE_DETAIL_RENTAL(id),
  //     data
  //   );
  //   return response;
  // },
};
