import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { RentalStatus } from "generated/prisma/client";

import type { RentalRepoError, RentalRepositoryError } from "../domain-errors";
import type {
  AdminRentalDetail,
  AdminRentalFilter,
  AdminRentalListItem,
  MyRentalFilter,
  RentalCountsRow,
  RentalRow,
  RentalSortField,
} from "../models";

export type CreateRentalInput = {
  userId: string;
  bikeId: string;
  startStationId: string;
  startTime: Date;
  subscriptionId?: string | null;
};

export type CreateReservedRentalInput = {
  reservationId: string;
  userId: string;
  bikeId: string;
  startStationId: string;
  startTime: Date;
  subscriptionId?: string | null;
};

export type UpdateRentalOnEndInput = {
  rentalId: string;
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

  createReservedRentalForReservation: (
    data: CreateReservedRentalInput,
  ) => Effect.Effect<RentalRow, RentalRepoError>;

  updateRentalOnEnd: (
    data: UpdateRentalOnEndInput,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  findById: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  /**
   * EN: Assign bike to a reserved rental if it is still unassigned.
   * VI: Gán bike cho rental RESERVED nếu vẫn chưa có bike.
   */
  assignBikeToReservedRental: (
    rentalId: string,
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, RentalRepositoryError>;

  /**
   * EN: Start a RESERVED rental by marking it RENTED and setting start time.
   * VI: Bắt đầu rental RESERVED bằng cách chuyển sang RENTED và set start time.
   */
  startReservedRental: (
    rentalId: string,
    startTime: Date,
    updatedAt: Date,
    subscriptionId: string | null,
  ) => Effect.Effect<boolean, RentalRepositoryError>;

  /**
   * EN: Cancel a RESERVED rental (no-op if status already changed).
   * VI: Hủy rental RESERVED (không làm gì nếu status đã đổi).
   */
  cancelReservedRental: (
    rentalId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, RentalRepositoryError>;

  // Admin read views
  adminListRentals: (
    filter: AdminRentalFilter,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<AdminRentalListItem>, RentalRepositoryError>;

  adminGetRentalById: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<AdminRentalDetail>, RentalRepositoryError>;
};
