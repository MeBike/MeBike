import { BikesContracts } from "@mebike/shared";

export type BikesRoutes = typeof import("@mebike/shared")["serverRoutes"]["bikes"];

export type BikeSummary = BikesContracts.BikeSummary;
export type BikeNotFoundResponse = BikesContracts.BikeNotFoundResponse;
export type BikeUpdateConflictResponse = BikesContracts.BikeUpdateConflictResponse;
export type BikeRentalStatsResponse = BikesContracts.BikeRentalStats;
export type HighestRevenueBikeResponse = BikesContracts.HighestRevenueBike | null;
export type BikeActivityStatsResponse = BikesContracts.BikeActivityStats;
export type BikeRentalHistoryResponse = {
  data: BikesContracts.BikeRentalHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type BikeListResponse = {
  data: BikeSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export const { BikeErrorCodeSchema, bikeErrorMessages } = BikesContracts;
