import { Effect, Option } from "effect";

import { makeBikeRepository } from "@/domain/bikes";
import {
  defectOn,
  isWallClockWithinOvernightOperationsWindow,
  makeFixedSlotTemplateStartOutsideOperatingHoursError,
} from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { FixedSlotTemplateRow } from "../../models";

import {
  FixedSlotTemplateDateLocked,
  FixedSlotTemplateDateNotFound,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateNotFound,
  FixedSlotTemplateConflict,
  FixedSlotTemplateUpdateConflict,
} from "../../domain-errors";
import { makeReservationCommandRepository } from "../../repository/reservation-command.repository";
import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";
import { applyTemplateMutation, ensureTemplateMutationAllowed } from "./mutations";
import {
  normalizeSlotDate,
  parseSlotDateKey,
  parseSlotTimeValue,
  toSlotDateKey,
} from "../fixed-slot/fixed-slot.helpers";

/**
 * Cập nhật giờ bắt đầu hoặc tập ngày của fixed-slot template.
 *
 * Hàm này xử lý validation của payload mới trước khi giao phần mutation diff
 * cho `applyTemplateMutation(...)`.
 *
 * @param args Dữ liệu update template.
 * @param args.userId ID user sở hữu template.
 * @param args.templateId ID template cần cập nhật.
 * @param args.slotStart Giờ mới dạng `HH:mm`, nếu caller muốn đổi giờ.
 * @param args.slotDates Tập ngày mới dạng `YYYY-MM-DD`, nếu caller muốn thay cả lịch.
 * @param args.now Mốc hiện tại để khóa ngày đã qua hoặc hôm nay.
 */
export function updateFixedSlotTemplateForUser(args: {
  readonly userId: string;
  readonly templateId: string;
  readonly slotStart?: string;
  readonly slotDates?: ReadonlyArray<string>;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotTemplateRow,
  | FixedSlotTemplateNotFound
  | FixedSlotTemplateDateNotFuture
  | FixedSlotTemplateDateLocked
  | import("@/domain/shared").FixedSlotTemplateStartOutsideOperatingHours
  | FixedSlotTemplateConflict
  | FixedSlotTemplateUpdateConflict,
  Prisma
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const now = args.now ?? new Date();
    const today = normalizeSlotDate(now);

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txQueryRepo = makeReservationQueryRepository(tx);
        const txCommandRepo = makeReservationCommandRepository(tx);
        const bikeRepo = makeBikeRepository(tx);

        const templateOpt = yield* txQueryRepo.findFixedSlotTemplateByIdForUser(
          args.userId,
          args.templateId,
        );
        if (Option.isNone(templateOpt)) {
          return yield* Effect.fail(new FixedSlotTemplateNotFound({
            templateId: args.templateId,
          }));
        }

        const template = yield* ensureTemplateMutationAllowed(templateOpt.value, args.templateId);
        const currentDateKeySet = new Set(template.slotDates.map(toSlotDateKey));
        const lockedDateKeySet = new Set(
          template.slotDates
            .filter(slotDate => slotDate.getTime() <= today.getTime())
            .map(toSlotDateKey),
        );

        const nextSlotStart = args.slotStart ? parseSlotTimeValue(args.slotStart) : template.slotStart;
        if (
          args.slotStart !== undefined
          && isWallClockWithinOvernightOperationsWindow(nextSlotStart)
        ) {
          return yield* Effect.fail(
            makeFixedSlotTemplateStartOutsideOperatingHoursError(nextSlotStart),
          );
        }

        let nextSlotDates = template.slotDates;
        if (args.slotDates) {
          nextSlotDates = args.slotDates.map(parseSlotDateKey);
          const nextDateKeySet = new Set(nextSlotDates.map(toSlotDateKey));

          for (const lockedDateKey of lockedDateKeySet) {
            if (!nextDateKeySet.has(lockedDateKey)) {
              return yield* Effect.fail(new FixedSlotTemplateDateLocked({
                slotDate: lockedDateKey,
              }));
            }
          }

          for (const slotDate of nextSlotDates) {
            const slotDateKey = toSlotDateKey(slotDate);
            if (slotDate.getTime() <= today.getTime() && !currentDateKeySet.has(slotDateKey)) {
              return yield* Effect.fail(new FixedSlotTemplateDateNotFuture({ slotDate: slotDateKey }));
            }
          }
        }

        return yield* applyTemplateMutation({
          userId: args.userId,
          template,
          templateId: args.templateId,
          nextSlotStart,
          nextSlotDates,
          now,
          tx,
          txQueryRepo,
          txCommandRepo,
          bikeRepo,
        });
      }),
    ).pipe(defectOn(PrismaTransactionError));
  });
}

/**
 * Xóa một ngày cụ thể khỏi fixed-slot template.
 *
 * Đây là biến thể hẹp của update, nhưng tách riêng để public API vẫn rõ nghĩa.
 *
 * @param args Dữ liệu đầu vào để bỏ một ngày khỏi template.
 * @param args.userId ID user sở hữu template.
 * @param args.templateId ID template cần sửa.
 * @param args.slotDate Ngày cần xóa dạng `YYYY-MM-DD`.
 * @param args.now Mốc hiện tại để khóa ngày không còn được phép sửa.
 */
export function removeFixedSlotTemplateDateForUser(args: {
  readonly userId: string;
  readonly templateId: string;
  readonly slotDate: string;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotTemplateRow,
  | FixedSlotTemplateNotFound
  | FixedSlotTemplateDateLocked
  | FixedSlotTemplateDateNotFound
  | FixedSlotTemplateConflict
  | FixedSlotTemplateUpdateConflict,
  Prisma
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const now = args.now ?? new Date();
    const today = normalizeSlotDate(now);
    const targetSlotDate = parseSlotDateKey(args.slotDate);
    const targetSlotDateKey = toSlotDateKey(targetSlotDate);

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txQueryRepo = makeReservationQueryRepository(tx);
        const txCommandRepo = makeReservationCommandRepository(tx);
        const bikeRepo = makeBikeRepository(tx);

        const templateOpt = yield* txQueryRepo.findFixedSlotTemplateByIdForUser(
          args.userId,
          args.templateId,
        );
        if (Option.isNone(templateOpt)) {
          return yield* Effect.fail(new FixedSlotTemplateNotFound({
            templateId: args.templateId,
          }));
        }

        const template = yield* ensureTemplateMutationAllowed(templateOpt.value, args.templateId);
        const currentDateKeySet = new Set(template.slotDates.map(toSlotDateKey));
        if (!currentDateKeySet.has(targetSlotDateKey)) {
          return yield* Effect.fail(new FixedSlotTemplateDateNotFound({
            templateId: args.templateId,
            slotDate: targetSlotDateKey,
          }));
        }

        if (targetSlotDate.getTime() <= today.getTime()) {
          return yield* Effect.fail(new FixedSlotTemplateDateLocked({
            slotDate: targetSlotDateKey,
          }));
        }

        return yield* applyTemplateMutation({
          userId: args.userId,
          template,
          templateId: args.templateId,
          nextSlotStart: template.slotStart,
          nextSlotDates: template.slotDates.filter(slotDate => toSlotDateKey(slotDate) !== targetSlotDateKey),
          now,
          tx,
          txQueryRepo,
          txCommandRepo,
          bikeRepo,
        });
      }),
    ).pipe(defectOn(PrismaTransactionError));
  });
}
