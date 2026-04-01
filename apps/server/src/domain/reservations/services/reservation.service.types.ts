import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  ActiveReservationExists,
  BikeAlreadyReserved,
  InvalidReservationTransition,
  ReservationMissingBike,
  ReservationNotFound,
  ReservationNotOwned,
} from "../domain-errors";
import type {
  AdminReservationFilter,
  AdminReservationSortField,
  ReservationExpandedDetailRow,
  ReservationFilter,
  ReservationRow,
  ReservationSortField,
} from "../models";
import type { UpdateReservationStatusInput } from "../types";

export type ConfirmPendingReservationResult = {
  readonly reservation: ReservationRow;
  readonly bikeId: string;
};

export type ReservationQueryService = {
  getById: (reservationId: string) => Effect.Effect<Option.Option<ReservationRow>>;
  getExpandedDetailById: (
    reservationId: string,
  ) => Effect.Effect<Option.Option<ReservationExpandedDetailRow>>;
  listForUser: (
    userId: string,
    filter: ReservationFilter,
    pageReq: PageRequest<ReservationSortField>,
  ) => Effect.Effect<PageResult<ReservationRow>>;
  listForAdmin: (
    filter: AdminReservationFilter,
    pageReq: PageRequest<AdminReservationSortField>,
  ) => Effect.Effect<PageResult<ReservationRow>>;
  getLatestPendingOrActiveForUser: (
    userId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
  getLatestPendingOrActiveForUserInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    userId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
  getCurrentHoldForUserNow: (
    userId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
  getCurrentHoldForUserNowInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
  getCurrentHoldForBikeNow: (
    bikeId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
  getCurrentHoldForBikeNowInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    bikeId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
};

export type ReservationCommandService = {
  markExpiredNow: (now: Date) => Effect.Effect<number>;
  updateStatus: (
    input: UpdateReservationStatusInput,
  ) => Effect.Effect<ReservationRow, ReservationNotFound>;
  validatePendingForConfirmationInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly reservationId: string;
      readonly userId: string;
      readonly now: Date;
    },
  ) => Effect.Effect<
    ConfirmPendingReservationResult,
    | ReservationNotFound
    | ReservationNotOwned
    | ReservationMissingBike
    | InvalidReservationTransition
  >;
  cancelPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly reservationId: string;
      readonly userId: string;
      readonly now: Date;
    },
  ) => Effect.Effect<
    ReservationRow,
    | ReservationNotFound
    | ReservationNotOwned
    | InvalidReservationTransition
  >;
  reserveHoldInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly userId: string;
      readonly bikeId: string;
      readonly stationId: string;
      readonly pricingPolicyId: string | null;
      readonly reservationOption: ReservationRow["reservationOption"];
      readonly subscriptionId: string | null;
      readonly startTime: Date;
      readonly endTime: Date | null;
      readonly prepaid: ReservationRow["prepaid"];
    },
  ) => Effect.Effect<ReservationRow, BikeAlreadyReserved | ActiveReservationExists>;
};
