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
  depositHoldId?: string | null;
  pricingPolicyId?: string | null;
  startStationId: string;
  startTime: Date;
  subscriptionId?: string | null;
  reservationId?: string | null;
};

export type UpdateRentalDepositHoldInput = {
  rentalId: string;
  depositHoldId: string;
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
  ) => Effect.Effect<PageResult<RentalRow>>;

  listMyCurrentRentals: (
    userId: string,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>>;

  getMyRentalById: (
    userId: string,
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>>;

  getMyRentalCounts: (
    userId: string,
  ) => Effect.Effect<readonly RentalCountsRow[]>;

  // Helpers for future use-cases
  findActiveByBikeId: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<RentalRow>>;

  findActiveByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<RentalRow>>;

  // Core rental operations
  createRental: (
    data: CreateRentalInput,
  ) => Effect.Effect<RentalRow, RentalRepoError>;

  updateRentalDepositHold: (
    data: UpdateRentalDepositHoldInput,
  ) => Effect.Effect<Option.Option<RentalRow>>;

  updateRentalOnEnd: (
    data: UpdateRentalOnEndInput,
  ) => Effect.Effect<Option.Option<RentalRow>>;

  findById: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>>;

  // Admin read views
  adminListRentals: (
    filter: AdminRentalFilter,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<AdminRentalListItem>>;

  adminGetRentalById: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<AdminRentalDetail>>;

  listActiveRentalsByPhone: (
    phoneNumber: string,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<AdminRentalListItem>>;

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
