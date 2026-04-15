import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { ReservationStatus } from "generated/prisma/client";

import type { ReservationRepo } from "../reservation.repository.types";

import { ReservationRepositoryError } from "../../domain-errors";
import {
  selectFixedSlotTemplateRow,
  selectReservationExpandedDetailRow,
  selectReservationRow,
  toFixedSlotTemplateRow,
  toReservationExpandedDetailRow,
  toReservationRow,
} from "../reservation.mappers";

const selectFixedSlotAssignmentTemplateRow = {
  id: true,
  userId: true,
  stationId: true,
  slotStart: true,
  user: { select: { fullName: true, email: true } },
  station: { select: { name: true, totalCapacity: true } },
} as const;

export type ReservationCoreReadRepo = Pick<
  ReservationRepo,
  | "findById"
  | "findExpandedDetailById"
  | "findPendingFixedSlotByTemplateAndStart"
  | "findFixedSlotTemplateByIdForUser"
  | "listActiveFixedSlotTemplatesByDate"
  | "listPendingFixedSlotReservationsByTemplateId"
  | "countActiveFixedSlotTemplateConflicts"
  | "listFixedSlotTemplatesForUser"
>;

/**
 * Tao read repository toi gian cho reservation va fixed-slot flow.
 *
 * @param client Prisma client hoac transaction client.
 * @returns Read repository phuc vu query reservation/fixed-slot.
 */
export function makeReservationCoreReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationCoreReadRepo {
  return {
    findById: reservationId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findUnique({
            where: { id: reservationId },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
        defectOn(ReservationRepositoryError),
      ),

    findExpandedDetailById: reservationId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findUnique({
            where: { id: reservationId },
            select: selectReservationExpandedDetailRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findExpandedDetailById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationExpandedDetailRow)),
        ),
        defectOn(ReservationRepositoryError),
      ),

    /**
     * Tim reservation PENDING cua fixed-slot theo template + startTime.
     *
     * Dung de worker tranh tao trung reservation cho cung mot slot ngay.
     *
     * @param templateId ID fixed-slot template.
     * @param startTime Moc bat dau slot can doi chieu.
     * @returns Effect tra ve reservation neu da ton tai.
     */
    findPendingFixedSlotByTemplateAndStart: (templateId, startTime) =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              fixedSlotTemplateId: templateId,
              reservationOption: "FIXED_SLOT",
              startTime,
              status: ReservationStatus.PENDING,
            },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findPendingFixedSlotByTemplateAndStart",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
        defectOn(ReservationRepositoryError),
      ),

    findFixedSlotTemplateByIdForUser: (userId, templateId) =>
      Effect.tryPromise({
        try: () =>
          client.fixedSlotTemplate.findFirst({
            where: {
              id: templateId,
              userId,
            },
            select: selectFixedSlotTemplateRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findFixedSlotTemplateByIdForUser",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toFixedSlotTemplateRow)),
        ),
        defectOn(ReservationRepositoryError),
      ),

    listActiveFixedSlotTemplatesByDate: slotDate =>
      Effect.tryPromise({
        try: () =>
          client.fixedSlotTemplate.findMany({
            where: {
              status: "ACTIVE",
              dates: { some: { slotDate } },
            },
            select: selectFixedSlotAssignmentTemplateRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "listActiveFixedSlotTemplatesByDate",
            cause: err,
          }),
      }).pipe(
        Effect.map(rows => rows),
        defectOn(ReservationRepositoryError),
      ),

    listPendingFixedSlotReservationsByTemplateId: templateId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findMany({
            where: {
              fixedSlotTemplateId: templateId,
              reservationOption: "FIXED_SLOT",
              status: ReservationStatus.PENDING,
            },
            orderBy: {
              startTime: "asc",
            },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "listPendingFixedSlotReservationsByTemplateId",
            cause: err,
          }),
      }).pipe(
        Effect.map(rows => rows.map(toReservationRow)),
        defectOn(ReservationRepositoryError),
      ),

    /**
     * Dem so fixed-slot template ACTIVE bi trung user + gio + tap ngay.
     *
     * @param userId ID user so huu template.
     * @param slotStart Gio bat dau cua slot.
     * @param slotDates Tap ngay can kiem tra conflict.
     * @param excludeTemplateId Template can bo qua khi dang update.
     * @returns Effect tra ve so conflict tim thay.
     */
    countActiveFixedSlotTemplateConflicts: (userId, slotStart, slotDates, excludeTemplateId) =>
      Effect.tryPromise({
        try: () =>
          client.fixedSlotTemplate.count({
            where: {
              userId,
              ...(excludeTemplateId ? { id: { not: excludeTemplateId } } : {}),
              status: "ACTIVE",
              slotStart,
              dates: {
                some: {
                  slotDate: {
                    in: [...slotDates],
                  },
                },
              },
            },
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "countActiveFixedSlotTemplateConflicts",
            cause: err,
          }),
      }).pipe(defectOn(ReservationRepositoryError)),

    listFixedSlotTemplatesForUser: (userId, filter, pageReq) => {
      const page = normalizedPage({
        page: pageReq.page,
        pageSize: pageReq.pageSize,
      });

      return Effect.tryPromise({
        try: async () => {
          const where = {
            userId,
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.stationId ? { stationId: filter.stationId } : {}),
          };

          const [rows, total] = await Promise.all([
            client.fixedSlotTemplate.findMany({
              where,
              orderBy: {
                updatedAt: "desc",
              },
              skip: (page.page - 1) * page.pageSize,
              take: page.pageSize,
              select: selectFixedSlotTemplateRow,
            }),
            client.fixedSlotTemplate.count({ where }),
          ]);

          return makePageResult(
            rows.map(toFixedSlotTemplateRow),
            total,
            page.page,
            page.pageSize,
          );
        },
        catch: err =>
          new ReservationRepositoryError({
            operation: "listFixedSlotTemplatesForUser",
            cause: err,
          }),
      }).pipe(defectOn(ReservationRepositoryError));
    },
  };
}
