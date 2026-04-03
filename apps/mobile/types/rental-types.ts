import type {
  BikeSummary,
  BikeSwapRequest,
  BikeSwapRequestDetail,
  BikeSwapRequestListResponse,
  BikeSwapStatus,
  CreateRentalPayload,
  CreateReturnSlotPayload,
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
  RequestBikeSwapPayload,
  ReturnSlotReservation,
  StationReadSummary,
} from "@/contracts/server";

export type {
  BikeSwapRequest,
  BikeSwapRequestDetail,
  BikeSwapRequestListResponse,
  BikeSwapStatus,
  CreateRentalPayload,
  CreateReturnSlotPayload,
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
  RequestBikeSwapPayload,
  ReturnSlotReservation,
};

export type MyRentalResolvedDetail = {
  rental: Rental;
  bike: BikeSummary | null;
  startStation: StationReadSummary | null;
  endStation: StationReadSummary | null;
  returnSlot: ReturnSlotReservation | null;
  returnStation: StationReadSummary | null;
};

export type RentalListParams = {
  page?: number;
  pageSize?: number;
  status?: RentalStatus;
  startStation?: string;
  endStation?: string;
};

export type BikeSwapRequestListParams = {
  page?: number;
  pageSize?: number;
  userId?: string;
  stationId?: string;
  rentalId?: string;
  status?: BikeSwapStatus;
  sortBy?: "status" | "updatedAt" | "createdAt";
  sortDir?: "asc" | "desc";
};

export type MyBikeSwapRequestListParams = {
  page?: number;
  pageSize?: number;
  rentalId?: string;
  status?: BikeSwapStatus;
};

export type RejectBikeSwapRequestPayload = {
  reason: string;
};
