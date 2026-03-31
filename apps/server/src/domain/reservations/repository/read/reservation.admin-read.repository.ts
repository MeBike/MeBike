import { Effect } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { ReservationStatus } from "generated/prisma/client";

import type { ReservationRepo } from "../reservation.repository.types";

import { ReservationRepositoryError } from "../../domain-errors";
import { selectReservationRow, toReservationRow } from "../reservation.mappers";
import { toReservationOrderBy, toReservationWhereForAdmin } from "../reservation.queries";

export type ReservationAdminReadRepo = Pick<
  ReservationRepo,
  "countPendingByStationId" | "listForAdmin"
>;

export function makeReservationAdminReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationAdminReadRepo {
  return {
    countPendingByStationId: stationId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.count({
            where: {
              stationId,
              status: ReservationStatus.PENDING,
            },
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "countPendingByStationId",
            cause: err,
          }),
      }).pipe(defectOn(ReservationRepositoryError)),

    listForAdmin: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const where = toReservationWhereForAdmin(filter);
        const orderBy = toReservationOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.reservation.count({ where }),
            catch: err =>
              new ReservationRepositoryError({
                operation: "listForAdmin.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.reservation.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectReservationRow,
              }),
            catch: err =>
              new ReservationRepositoryError({
                operation: "listForAdmin.findMany",
                cause: err,
              }),
          }),
        ]);

        const rows = items.map(toReservationRow);
        return makePageResult(rows, total, page, pageSize);
      }).pipe(defectOn(ReservationRepositoryError)),
  };
}
