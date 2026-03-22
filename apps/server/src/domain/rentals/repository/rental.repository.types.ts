import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { RentalStatus } from "generated/prisma/client";

import type {
  BikeSwapRequestExisted,
  BikeSwapRequestNotFound,
  InvalidBikeSwapRequestStatus,
  NoAvailableBike,
  RentalRepoError,
  RentalRepositoryError,
} from "../domain-errors";
import type {
  AdminBikeSwapRequestFilter,
  AdminRentalDetail,
  AdminRentalFilter,
  AdminRentalListItem,
  BikeSwapRequestRow,
  MyRentalFilter,
  RentalCountsRow,
  RentalRow,
  RentalSortField,
  StaffBikeSwapRequestFilter,
  StaffBikeSwapRequestRow,
  StaffBikeSwapRequestSortField,
} from "../models";

export type CreateRentalInput = {
  userId: string;
  bikeId: string;
  pricingPolicyId?: string | null;
  startStationId: string;
  startTime: Date;
  subscriptionId?: string | null;
  reservationId?: string | null;
};

export type UpdateRentalOnEndInput = {
  rentalId: string;
  pricingPolicyId?: string | null;
  endStationId: string;
  endTime: Date;
  durationMinutes: number;
  totalPrice: number | null;
  newStatus: RentalStatus;
};

export type RentalRepo = {
  // User "/me" views
  listMyRentals: (
    userId: string,
    filter: MyRentalFilter,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>, RentalRepositoryError>;

  listMyCurrentRentals: (
    userId: string,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>, RentalRepositoryError>;

  getMyRentalById: (
    userId: string,
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  getMyRentalCounts: (
    userId: string,
  ) => Effect.Effect<readonly RentalCountsRow[], RentalRepositoryError>;

  // Helpers for future use-cases
  findActiveByBikeId: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  findActiveByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  // Core rental operations
  createRental: (
    data: CreateRentalInput,
  ) => Effect.Effect<RentalRow, RentalRepoError>;

  updateRentalOnEnd: (
    data: UpdateRentalOnEndInput,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  findById: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  // Admin read views
  adminListRentals: (
    filter: AdminRentalFilter,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<AdminRentalListItem>, RentalRepositoryError>;

  adminGetRentalById: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<AdminRentalDetail>, RentalRepositoryError>;

  listActiveRentalsByPhone: (
    phoneNumber: string,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<AdminRentalListItem>, RentalRepositoryError>;

  requestBikeSwap: (
    rentalId: string,
    userId: string,
    oldBikeId: string,
    stationId: string,
  ) => Effect.Effect<
    BikeSwapRequestRow,
    RentalRepositoryError | BikeSwapRequestExisted
  >;

  staffListBikeSwapRequests: (
    filter: StaffBikeSwapRequestFilter,
    pageReq: PageRequest<StaffBikeSwapRequestSortField>,
  ) => Effect.Effect<
    PageResult<StaffBikeSwapRequestRow>,
    RentalRepositoryError
  >;

  staffGetBikeSwapRequests: (
    bikeSwapRequestId: string,
  ) => Effect.Effect<
    Option.Option<StaffBikeSwapRequestRow>,
    RentalRepositoryError
  >;

  adminListBikeSwapRequests: (
    filter: AdminBikeSwapRequestFilter,
    pageReq: PageRequest<StaffBikeSwapRequestSortField>,
  ) => Effect.Effect<
    PageResult<StaffBikeSwapRequestRow>,
    RentalRepositoryError
  >;

  staffApproveBikeSwapRequests: (
    bikeSwapRequestId: string,
  ) => Effect.Effect<
    Option.Option<StaffBikeSwapRequestRow>,
    | RentalRepositoryError
    | BikeSwapRequestNotFound
    | NoAvailableBike
    | InvalidBikeSwapRequestStatus
  >;

  staffRejectBikeSwapRequests: (
    bikeSwapRequestId: string,
    reason: string,
  ) => Effect.Effect<
    Option.Option<StaffBikeSwapRequestRow>,
    | RentalRepositoryError
    | BikeSwapRequestNotFound
    | InvalidBikeSwapRequestStatus
  >;
};
