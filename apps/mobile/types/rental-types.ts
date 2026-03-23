import type {
  CreateRentalPayload,
  MyRentalListResponse,
  Rental,
  RentalCounts,
  RentalCountsResponse,
  RentalDetail,
  RentalListItem,
  RentalListResponse,
  RentalStatus,
  RentalWithPrice,
  RentalWithPricing,
} from "@/contracts/server";

export type {
  CreateRentalPayload,
  MyRentalListResponse,
  Rental,
  RentalCounts,
  RentalCountsResponse,
  RentalDetail,
  RentalListItem,
  RentalListResponse,
  RentalStatus,
  RentalWithPrice,
  RentalWithPricing,
};

export type RentalListParams = {
  page?: number;
  pageSize?: number;
  status?: RentalStatus;
  startStation?: string;
  endStation?: string;
};
