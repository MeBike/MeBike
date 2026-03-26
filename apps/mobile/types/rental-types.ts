import type {
  BikeSummary,
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
  ReturnSlotReservation,
  StationReadSummary,
} from "@/contracts/server";

export type {
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
