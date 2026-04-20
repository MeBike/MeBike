import { Effect, Option } from "effect";

import { makeBikeRepository } from "@/domain/bikes";
import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { FixedSlotTemplateRow } from "../../models";

import {
  FixedSlotTemplateCancelConflict,
  FixedSlotTemplateNotFound,
} from "../../domain-errors";
import { makeReservationCommandRepository } from "../../repository/reservation-command.repository";
import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";

/**
 * Hủy template và toàn bộ pending reservation được materialize từ template đó.
 *
 * Flow này cần giữ cùng transaction để không rơi vào trạng thái template đã hủy
 * nhưng reservation/bike liên quan chưa được rollback sạch.
 *
 * @param args Dữ liệu đầu vào cho flow hủy template.
 * @param args.userId ID user sở hữu template.
 * @param args.templateId ID template cần hủy.
 * @param args.now Mốc thời gian dùng cho update status và release bike.
 */
export function cancelFixedSlotTemplateForUser(args: {
  readonly userId: string;
  readonly templateId: string;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotTemplateRow,
  FixedSlotTemplateNotFound | FixedSlotTemplateCancelConflict,
  Prisma
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const now = args.now ?? new Date();

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

        const pendingReservations = yield* txQueryRepo.listPendingFixedSlotReservationsByTemplateId(
          args.templateId,
        );

        for (const reservation of pendingReservations) {
          yield* txCommandRepo.updateStatus({
            reservationId: reservation.id,
            status: "CANCELLED",
            updatedAt: now,
          }).pipe(
            Effect.catchTag("ReservationNotFound", () =>
              Effect.fail(new FixedSlotTemplateCancelConflict({ templateId: args.templateId }))),
          );

          if (reservation.bikeId) {
            const released = yield* bikeRepo.releaseBikeIfReserved(reservation.bikeId, now);
            if (!released) {
              return yield* Effect.fail(new FixedSlotTemplateCancelConflict({ templateId: args.templateId }));
            }
          }
        }

        if (templateOpt.value.status === "CANCELLED") {
          return templateOpt.value;
        }

        return yield* txCommandRepo.updateFixedSlotTemplateStatus({
          templateId: args.templateId,
          status: "CANCELLED",
          updatedAt: now,
        });
      })).pipe(defectOn(PrismaTransactionError));
  });
}
