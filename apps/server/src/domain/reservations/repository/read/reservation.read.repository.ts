import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { ReservationRepo } from "../reservation.repository.types";

import { makeReservationAdminReadRepository } from "./reservation.admin-read.repository";
import { makeReservationCoreReadRepository } from "./reservation.core-read.repository";
import { makeReservationHoldReadRepository } from "./reservation.hold-read.repository";
import { makeReservationUserReadRepository } from "./reservation.user-read.repository";

export type ReservationReadRepo = Pick<
  ReservationRepo,
  | "findById"
  | "findExpandedDetailById"
  | "findLatestPendingOrActiveByUserId"
  | "findLatestPendingOrActiveByBikeId"
  | "findPendingHoldByUserIdNow"
  | "findPendingHoldByBikeIdNow"
  | "countPendingByStationId"
  | "findActiveByUserId"
  | "findPendingFixedSlotByTemplateAndStart"
  | "findNextUpcomingByUserId"
  | "listForUser"
  | "listForAdmin"
>;

export function makeReservationReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationReadRepo {
  return {
    ...makeReservationCoreReadRepository(client),
    ...makeReservationUserReadRepository(client),
    ...makeReservationHoldReadRepository(client),
    ...makeReservationAdminReadRepository(client),
  };
}
