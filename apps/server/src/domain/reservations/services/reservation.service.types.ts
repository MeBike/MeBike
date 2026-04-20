import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  AdminReservationFilter,
  AdminReservationSortField,
  ReservationExpandedDetailRow,
  ReservationFilter,
  ReservationRow,
  ReservationSortField,
} from "../models";

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
