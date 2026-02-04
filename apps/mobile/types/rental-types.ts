import type { ServerContracts } from "@mebike/shared";

export type RentalStatus = ServerContracts.RentalsContracts.RentalStatus;
export type Rental = ServerContracts.RentalsContracts.Rental;
export type RentalWithPrice = ServerContracts.RentalsContracts.RentalWithPrice;
export type RentalDetail = ServerContracts.RentalsContracts.RentalDetail;
export type RentalWithPricing = ServerContracts.RentalsContracts.RentalWithPricing;
export type RentalCounts = ServerContracts.RentalsContracts.RentalStatusCounts;

export type RentalListResponse = {
  data: Rental[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type RentalListParams = {
  page?: number;
  pageSize?: number;
  status?: RentalStatus;
  startStation?: string;
  endStation?: string;
};

export type CreateRentalPayload = {
  bikeId: string;
  startStationId: string;
  subscriptionId?: string;
};
