import { Effect, Option } from "effect";

import { defectOn, isWallClockWithinOvernightOperationsWindow, makeFixedSlotTemplateStartOutsideOperatingHoursError } from "@/domain/shared";
import { makeStationQueryRepository } from "@/domain/stations";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { FixedSlotTemplateRow } from "../../models";

import {
  FixedSlotTemplateConflict,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateStationNotFound,
} from "../../domain-errors";
import { makeReservationCommandRepository } from "../../repository/reservation-command.repository";
import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";
import {
  normalizeSlotDate,
  parseSlotDateKey,
  parseSlotTimeValue,
  toSlotDateKey,
} from "../fixed-slot/fixed-slot.helpers";

/**
 * Tạo fixed-slot template mới cho user.
 *
 * Hàm này giữ trọn flow create trong một chỗ:
 * parse input, validate operating hours / ngày tương lai, rồi commit transaction.
 *
 * @param args Dữ liệu đầu vào để tạo template.
 * @param args.userId ID user sở hữu template.
 * @param args.stationId ID station áp dụng cho template.
 * @param args.slotStart Giờ bắt đầu dạng `HH:mm`.
 * @param args.slotDates Danh sách ngày dạng `YYYY-MM-DD`.
 * @param args.now Mốc hiện tại để khóa ngày quá khứ hoặc hôm nay.
 */
export function createFixedSlotTemplateForUser(args: {
  readonly userId: string;
  readonly stationId: string;
  readonly slotStart: string;
  readonly slotDates: ReadonlyArray<string>;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotTemplateRow,
  | FixedSlotTemplateStationNotFound
  | FixedSlotTemplateDateNotFuture
  | import("@/domain/shared").FixedSlotTemplateStartOutsideOperatingHours
  | FixedSlotTemplateConflict,
  Prisma
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const now = args.now ?? new Date();
    const today = normalizeSlotDate(now);
    const slotStart = parseSlotTimeValue(args.slotStart);
    const slotDates = args.slotDates.map(parseSlotDateKey);

    if (isWallClockWithinOvernightOperationsWindow(slotStart)) {
      return yield* Effect.fail(
        makeFixedSlotTemplateStartOutsideOperatingHoursError(slotStart),
      );
    }

    for (const slotDate of slotDates) {
      if (slotDate.getTime() <= today.getTime()) {
        return yield* Effect.fail(new FixedSlotTemplateDateNotFuture({
          slotDate: toSlotDateKey(slotDate),
        }));
      }
    }

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txStationRepo = makeStationQueryRepository(tx);
        const txReservationQueryRepo = makeReservationQueryRepository(tx);
        const txReservationCommandRepo = makeReservationCommandRepository(tx);

        const stationOpt = yield* txStationRepo.getById(args.stationId);
        if (Option.isNone(stationOpt)) {
          return yield* Effect.fail(new FixedSlotTemplateStationNotFound({
            stationId: args.stationId,
          }));
        }

        const conflictCount = yield* txReservationQueryRepo.countActiveFixedSlotTemplateConflicts(
          args.userId,
          slotStart,
          slotDates,
        );
        // FIX: Enforce active fixed-slot overlap at DB level.
        // This read-then-write check races under concurrent create/update requests and can still admit duplicate active templates.
        if (conflictCount > 0) {
          return yield* Effect.fail(new FixedSlotTemplateConflict({
            userId: args.userId,
            slotStart: args.slotStart,
            slotDates: [...args.slotDates],
          }));
        }

        return yield* txReservationCommandRepo.createFixedSlotTemplate({
          userId: args.userId,
          stationId: args.stationId,
          slotStart,
          slotDates,
          updatedAt: now,
        });
      })).pipe(defectOn(PrismaTransactionError));
  });
}
