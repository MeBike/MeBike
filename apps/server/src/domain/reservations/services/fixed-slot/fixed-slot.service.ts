import { Effect } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";

import type {
  FixedSlotAssignmentContext,
  FixedSlotAssignmentSummary,
  FixedSlotCounts,
} from "./fixed-slot.types";

import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";
import { processFixedSlotTemplate } from "./fixed-slot.assignment";
import { incrementFixedSlotCounts, normalizeSlotDate, toSlotDateKey } from "./fixed-slot.helpers";

/**
 * Chay worker flow de materialize reservation cho mot ngay fixed-slot.
 *
 * @param args Dau vao worker.
 * @param args.slotDate Ngay muon xu ly. Bo trong thi suy ra tu `assignmentTime`.
 * @param args.assignmentTime Moc thoi gian worker dang chay.
 * @param args.now Moc thoi gian dung cho side effect va outbox.
 * @returns Effect tong hop ket qua assignment cua toan bo template trong ngay do.
 */
export function assignFixedSlotReservations(args: {
  readonly slotDate?: Date;
  readonly assignmentTime?: Date;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotAssignmentSummary,
  never,
  Prisma | BikeRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* BikeRepository;
    const assignmentTime = args.assignmentTime ?? new Date();
    const slotDate = args.slotDate ?? normalizeSlotDate(assignmentTime);
    const context: FixedSlotAssignmentContext = {
      slotDate,
      slotDateKey: toSlotDateKey(slotDate),
      now: args.now ?? new Date(),
    };

    const reservationQueryRepo = makeReservationQueryRepository(client);
    const templates = yield* reservationQueryRepo.listActiveFixedSlotTemplatesByDate(slotDate);
    const counts: FixedSlotCounts = {
      assigned: 0,
      alreadyAssigned: 0,
      noBike: 0,
      billingFailed: 0,
      conflicts: 0,
    };
    // TODO(ops): Avoid "sequential death" — a single unexpected DB/infra failure currently dies the whole run.
    // Wrap per-template processing with `Effect.either` / `Effect.catchAll` to log + continue, and track an error count.

    for (const template of templates) {
      const outcome = yield* processFixedSlotTemplate(client, template, context);
      incrementFixedSlotCounts(counts, outcome);
    }

    return {
      slotDate: context.slotDateKey,
      totalTemplates: templates.length,
      ...counts,
    };
  });
}
