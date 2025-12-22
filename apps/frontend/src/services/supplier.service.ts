import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { Supplier } from "@/types/Supplier";
import { CreateSupplierSchema } from "@/schemas/supplier.schema";
import type { StatsSupplierBike } from "@custom-types";
import {GET_ALL_SUPPLIER,GET_DETAIL_SUPPLIER} from "@/graphql"
import { print } from "graphql";
import { GetSupplierResponse , GetDetailSupplierResponse } from "../types/supplier.type";
interface ApiResponse<T> {
  data: T[];
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
}
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
const SUPPLIER_BASE = "/suppliers";
const SUPPLIER_ENDPOINTS = {
  BASE: SUPPLIER_BASE,
  STATS: `${SUPPLIER_BASE}/stats`,
  WITH_ID: (id: string) => `${SUPPLIER_BASE}/${id}`,
  WITH_STATS_BIKE: (id: string) => `${SUPPLIER_BASE}/${id}/stats`,
} as const;
export const supplierService = {
  getAllSuppliers: async ({
    page,
    limit,
    status,
  }: {
    page?: number;
    limit?: number;
    status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG" | "";
  }): Promise<AxiosResponse<GetSupplierResponse>> => {
    const response = await fetchHttpClient.query<GetSupplierResponse>(
      print(GET_ALL_SUPPLIER)
    );
    return response;
  },
  getSupplierById: async (id: string): Promise<AxiosResponse <GetDetailSupplierResponse> > => {
    const response = await fetchHttpClient.query<GetDetailSupplierResponse>(
      print(GET_DETAIL_SUPPLIER),
      {
        supplierId : id
      }
    );
    return response;
  },
  createSupplier: async (
    supplierData: CreateSupplierSchema
  ): Promise<AxiosResponse<DetailApiResponse<Supplier>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<Supplier>>(
      SUPPLIER_ENDPOINTS.BASE,
      supplierData
    );
    return response;
  },
  // changeSupplierStatus: async (
  //   id: string,
  //   status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘ"
  // ): Promise<ApiResponse<Supplier>> => {
  //   const response = await fetchHttpClient.patch<ApiResponse<Supplier>>(
  //     SUPPLIER_ENDPOINTS.WITH_ID(id),
  //     { status }
  //   );
  //   return response.data;
  // },
  updateSupplier: async (
    {id,data} : {id: string, data: Partial<CreateSupplierSchema>}
  ): Promise<AxiosResponse<DetailApiResponse<Supplier>>> => {
    const response = await fetchHttpClient.put<DetailApiResponse<Supplier>>(
      SUPPLIER_ENDPOINTS.WITH_ID(id),
      data
    );
    return response;
  },
  statsSupplierBike: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<StatsSupplierBike[]>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<StatsSupplierBike[]>
    >(SUPPLIER_ENDPOINTS.WITH_STATS_BIKE(id));
    return response;
  },
  statsSupplier: async (): Promise<
    AxiosResponse<DetailApiResponse<StatsSupplierBike[]>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<StatsSupplierBike[]>
    >(SUPPLIER_ENDPOINTS.STATS);
    return response;
  },
  changeStatusSupplier: async (
    id: string,
    newStatus: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG"
  ): Promise<AxiosResponse<DetailApiResponse<Supplier>>> => {
    const response = await fetchHttpClient.patch<DetailApiResponse<Supplier>>(
      SUPPLIER_ENDPOINTS.WITH_ID(id),
      { newStatus }
    );
    return response;
  },
};
