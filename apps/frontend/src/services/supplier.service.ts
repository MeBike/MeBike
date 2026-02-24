import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { CreateSupplierSchema } from "@/schemas/supplier.schema";
import type { StatsSupplierBike , Supplier} from "@custom-types";
import { ApiResponse  } from "@custom-types";
import { ENDPOINT } from "@/constants/end-point";
export const supplierService = {
  getAllSuppliers: async ({
    page,
    limit,
    status,
  }: {
    page?: number;
    limit?: number;
    status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG" | "";
  }): Promise<AxiosResponse<ApiResponse<Supplier>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Supplier>>(
      ENDPOINT.SUPPLIER.BASE,
      {
        page: page,
        limit: limit,
        status: status,
      }
    );
    return response;
  },
  getSupplierById: async (id: string): Promise<AxiosResponse<Supplier>> => {
    const response = await fetchHttpClient.get<Supplier>(
      ENDPOINT.SUPPLIER.DETAIL(id)
    );
    return response;
  },
  createSupplier: async (
    supplierData: CreateSupplierSchema
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.post(
      ENDPOINT.SUPPLIER.BASE,
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
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(
      ENDPOINT.SUPPLIER.DETAIL(id),
      data
    );
    return response;
  },
  statsSupplierBike: async (
    id: string
  ): Promise<AxiosResponse<StatsSupplierBike> => {
    const response = await fetchHttpClient.get
      <StatsSupplierBike>
    (ENDPOINT.SUPPLIER.STATS_BIKE(id));
    return response;
  },
  statsSupplier: async (): Promise<
    AxiosResponse<StatsSupplierBike>
  > => {
    const response = await fetchHttpClient.get
      <StatsSupplierBike>
    (ENDPOINT.SUPPLIER.STATS);
    return response;
  },
  changeStatusSupplier: async (
    id: string,
    newStatus: "ACTIVE" | "INACTIVE" | "TERMINATED"
  ): Promise<AxiosResponse<Supplier> => {
    const response = await fetchHttpClient.patch<Supplier>(
      ENDPOINT.SUPPLIER.DETAIL(id),
      { newStatus }
    );
    return response;
  },
};
