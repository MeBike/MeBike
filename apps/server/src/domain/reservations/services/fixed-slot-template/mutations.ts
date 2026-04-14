import { Effect } from "effect";

import type { makeBikeRepository } from "@/domain/bikes";
import type {
  FixedSlotTemplateRow,
  ReservationRow,
} from "@/domain/reservations/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makePricingPolicyRepository } from "@/domain/pricing";
import { makeSubscriptionRepository } from "@/domain/subscriptions";
import { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";

import type { ReservationCommandRepo } from "../../repository/reservation-command.repository";
import type { ReservationQueryRepo } from "../../repository/reservation-query.repository";
import type { FixedSlotBillingResult } from "./fixed-slot-template.types";

import {
  FixedSlotTemplateConflict,
  FixedSlotTemplateNotFound,
  FixedSlotTemplateUpdateConflict,
} from "../../domain-errors";
import { selectFixedSlotTemplateRow, toFixedSlotTemplateRow } from "../../repository/reservation.mappers";
import {
  buildFixedSlotLabels,
  formatSlotTimeValue,
  normalizeSlotDate,
  toSlotDateKey,
} from "../fixed-slot/fixed-slot.helpers";
import { billFixedSlotDates } from "./billing";

/**
 * Tao cac ngay fixed-slot moi va gan billing snapshot cho tung ngay.
 *
 * @param tx Prisma transaction client dang duoc dung.
 * @param args Dau vao tao date row.
 * @param args.templateId ID template so huu cac ngay moi.
 * @param args.slotDates Danh sach ngay can tao.
 * @param args.billing Billing snapshot se duoc copy vao tung ngay.
 * @returns Effect fail neu so row tao ra khong khop du kien.
 */
function createFixedSlotDatesInTx(
  tx: PrismaTypes.TransactionClient,
  args: {
    templateId: string;
    slotDates: ReadonlyArray<Date>;
    billing: FixedSlotBillingResult;
  },
) {
  if (args.slotDates.length === 0) {
    return Effect.void;
  }

  return Effect.tryPromise({
    try: () =>
      tx.fixedSlotDate.createMany({
        data: args.slotDates.map(slotDate => ({
          templateId: args.templateId,
          pricingPolicyId: args.billing.pricingPolicyId,
          subscriptionId: args.billing.subscriptionId,
          prepaid: args.billing.prepaid,
          slotDate,
        })),
      }),
    catch: () => new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }),
  }).pipe(
    Effect.flatMap(result =>
      result.count === args.slotDates.length
        ? Effect.void
        : Effect.fail(new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }))),
  );
}

/**
 * Xoa cac ngay fixed-slot khoi template trong cung transaction.
 *
 * @param tx Prisma transaction client dang duoc dung.
 * @param args Dau vao xoa date row.
 * @param args.templateId ID template bi sua.
 * @param args.slotDates Danh sach ngay can xoa.
 * @returns Effect fail neu so row xoa ra khong khop du kien.
 */
function deleteFixedSlotDatesInTx(
  tx: PrismaTypes.TransactionClient,
  args: {
    templateId: string;
    slotDates: ReadonlyArray<Date>;
  },
) {
  if (args.slotDates.length === 0) {
    return Effect.void;
  }

  return Effect.tryPromise({
    try: () =>
      tx.fixedSlotDate.deleteMany({
        where: {
          templateId: args.templateId,
          slotDate: { in: [...args.slotDates] },
        },
      }),
    catch: () => new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }),
  }).pipe(
    Effect.flatMap(result =>
      result.count === args.slotDates.length
        ? Effect.void
        : Effect.fail(new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }))),
  );
}

/**
 * Doi gio bat dau cho reservation pending da duoc materialize.
 *
 * @param tx Prisma transaction client dang duoc dung.
 * @param args Dau vao update reservation.
 * @param args.templateId ID template de gan conflict neu update fail.
 * @param args.reservationId ID reservation can doi gio.
 * @param args.startTime Gio bat dau moi.
 * @param args.updatedAt Moc cap nhat.
 * @returns Effect fail neu reservation pending khong duoc update dung 1 row.
 */
function updatePendingReservationStartTimeInTx(
  tx: PrismaTypes.TransactionClient,
  args: {
    templateId: string;
    reservationId: string;
    startTime: Date;
    updatedAt: Date;
  },
) {
  return Effect.tryPromise({
    try: () =>
      tx.reservation.updateMany({
        where: {
          id: args.reservationId,
          status: "PENDING",
        },
        data: {
          startTime: args.startTime,
          updatedAt: args.updatedAt,
        },
      }),
    catch: () => new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }),
  }).pipe(
    Effect.flatMap(result =>
      result.count === 1
        ? Effect.void
        : Effect.fail(new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }))),
  );
}

/**
 * Cap nhat metadata chinh cua template sau khi xu ly mutation xong.
 *
 * @param tx Prisma transaction client dang duoc dung.
 * @param args Dau vao update template.
 * @param args.templateId ID template can update.
 * @param args.slotStart Gio bat dau moi.
 * @param args.status Status moi cua template.
 * @param args.updatedAt Moc cap nhat.
 * @returns Effect tra ve template row sau khi update.
 */
function updateFixedSlotTemplateInTx(
  tx: PrismaTypes.TransactionClient,
  args: {
    templateId: string;
    slotStart: Date;
    status: FixedSlotTemplateRow["status"];
    updatedAt: Date;
  },
) {
  return Effect.tryPromise({
    try: () =>
      tx.fixedSlotTemplate.update({
        where: { id: args.templateId },
        data: {
          slotStart: args.slotStart,
          status: args.status,
          updatedAt: args.updatedAt,
        },
        select: selectFixedSlotTemplateRow,
      }),
    catch: () => new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }),
  }).pipe(Effect.map(toFixedSlotTemplateRow));
}

/**
 * Chan mutate khi template khong con ACTIVE.
 *
 * @param template Template hien tai da load tu DB.
 * @param templateId ID template de dua vao not-found error.
 * @returns Effect tra lai template neu con ACTIVE, hoac fail neu khong cho mutate.
 */
export function ensureTemplateMutationAllowed(
  template: FixedSlotTemplateRow,
  templateId: string,
) {
  if (template.status !== "ACTIVE") {
    return Effect.fail(new FixedSlotTemplateNotFound({ templateId }));
  }

  return Effect.succeed(template);
}

/**
 * Huy cac pending reservation cua nhung ngay bi go bo.
 * Neu co bike giu cho reservation do thi release luon.
 *
 * @param args Dau vao xu ly reservation bi remove theo date diff.
 * @param args.pendingReservations Danh sach pending reservation cua template.
 * @param args.removeDateKeySet Tap ngay se bi go bo.
 * @param args.now Moc cap nhat.
 * @param args.templateId ID template de gan conflict neu co van de.
 * @param args.txCommandRepo Repo command cho reservation.
 * @param args.bikeRepo Repo bike de release bike dang giu.
 * @returns Effect fail neu khong huy/release an toan.
 */
function cancelRemovedPendingReservations(args: {
  pendingReservations: ReadonlyArray<ReservationRow>;
  removeDateKeySet: ReadonlySet<string>;
  now: Date;
  templateId: string;
  txCommandRepo: ReservationCommandRepo;
  bikeRepo: ReturnType<typeof makeBikeRepository>;
}) {
  return Effect.gen(function* () {
    for (const reservation of args.pendingReservations) {
      const reservationDate = normalizeSlotDate(reservation.startTime);
      const reservationDateKey = toSlotDateKey(reservationDate);

      if (!args.removeDateKeySet.has(reservationDateKey)) {
        continue;
      }

      yield* args.txCommandRepo.updateStatus({
        reservationId: reservation.id,
        status: "CANCELLED",
        updatedAt: args.now,
      }).pipe(
        Effect.catchTag("ReservationNotFound", () =>
          Effect.fail(new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }))),
      );

      if (reservation.bikeId) {
        const released = yield* args.bikeRepo.releaseBikeIfReserved(reservation.bikeId, args.now);
        if (!released) {
          return yield* Effect.fail(new FixedSlotTemplateUpdateConflict({ templateId: args.templateId }));
        }
      }
    }
  });
}

/**
 * Ap dung thay doi date/time cho template trong mot transaction.
 * Ham nay lo diff, charge them, huy ngay bo di, va cap nhat reservation pending.
 *
 * @param args Dau vao mutation.
 * @param args.userId ID user so huu template.
 * @param args.template Template hien tai.
 * @param args.templateId ID template dang mutate.
 * @param args.nextSlotStart Gio bat dau muc tieu sau mutation.
 * @param args.nextSlotDates Tap ngay muc tieu sau mutation.
 * @param args.now Moc cap nhat.
 * @param args.tx Prisma transaction client dang duoc dung.
 * @param args.txQueryRepo Repo query trong transaction hien tai.
 * @param args.txCommandRepo Repo command trong transaction hien tai.
 * @param args.bikeRepo Repo bike trong transaction hien tai.
 * @returns Effect tra ve template sau mutation, hoac fail neu conflict/billing/update khong an toan.
 */
export function applyTemplateMutation(args: {
  userId: string;
  template: FixedSlotTemplateRow;
  templateId: string;
  nextSlotStart: Date;
  nextSlotDates: ReadonlyArray<Date>;
  now: Date;
  tx: PrismaTypes.TransactionClient;
  txQueryRepo: ReservationQueryRepo;
  txCommandRepo: ReservationCommandRepo;
  bikeRepo: ReturnType<typeof makeBikeRepository>;
}) {
  return Effect.gen(function* () {
    const today = normalizeSlotDate(args.now);
    const currentDateKeySet = new Set(args.template.slotDates.map(toSlotDateKey));
    const nextDateKeySet = new Set(args.nextSlotDates.map(toSlotDateKey));
    const futureNextDates = args.nextSlotDates.filter(slotDate => slotDate.getTime() > today.getTime());

    if (futureNextDates.length > 0) {
      const conflictCount = yield* args.txQueryRepo.countActiveFixedSlotTemplateConflicts(
        args.userId,
        args.nextSlotStart,
        futureNextDates,
        args.templateId,
      );

      if (conflictCount > 0) {
        return yield* Effect.fail(new FixedSlotTemplateConflict({
          userId: args.userId,
          slotStart: formatSlotTimeValue(args.nextSlotStart),
          slotDates: futureNextDates.map(toSlotDateKey),
        }));
      }
    }

    const datesToAdd = args.nextSlotDates.filter(slotDate => !currentDateKeySet.has(toSlotDateKey(slotDate)));
    const datesToRemove = args.template.slotDates.filter(slotDate =>
      slotDate.getTime() > today.getTime() && !nextDateKeySet.has(toSlotDateKey(slotDate)));
    const removeDateKeySet = new Set(datesToRemove.map(toSlotDateKey));

    const pendingReservations = yield* args.txQueryRepo.listPendingFixedSlotReservationsByTemplateId(args.templateId);

    yield* cancelRemovedPendingReservations({
      pendingReservations,
      removeDateKeySet,
      now: args.now,
      templateId: args.templateId,
      txCommandRepo: args.txCommandRepo,
      bikeRepo: args.bikeRepo,
    });

    if (datesToAdd.length > 0) {
      const txSubscriptionRepo = makeSubscriptionRepository(args.tx);
      const txWalletRepo = makeWalletRepository(args.tx);
      const txPricingPolicyRepo = makePricingPolicyRepository(args.tx);
      const billing = yield* billFixedSlotDates({
        userId: args.userId,
        totalSlots: datesToAdd.length,
        txPricingPolicyRepo,
        txSubscriptionRepo,
        txWalletRepo,
      });

      yield* createFixedSlotDatesInTx(args.tx, {
        templateId: args.templateId,
        slotDates: datesToAdd,
        billing,
      });
    }

    const slotStartChanged = args.nextSlotStart.getTime() !== args.template.slotStart.getTime();
    if (slotStartChanged) {
      for (const reservation of pendingReservations) {
        const reservationDate = normalizeSlotDate(reservation.startTime);
        const reservationDateKey = toSlotDateKey(reservationDate);

        if (removeDateKeySet.has(reservationDateKey) || !nextDateKeySet.has(reservationDateKey)) {
          continue;
        }

        yield* updatePendingReservationStartTimeInTx(args.tx, {
          templateId: args.templateId,
          reservationId: reservation.id,
          startTime: buildFixedSlotLabels(reservationDate, args.nextSlotStart).slotStartAt,
          updatedAt: args.now,
        });
      }
    }

    yield* deleteFixedSlotDatesInTx(args.tx, {
      templateId: args.templateId,
      slotDates: datesToRemove,
    });

    return yield* updateFixedSlotTemplateInTx(args.tx, {
      templateId: args.templateId,
      slotStart: args.nextSlotStart,
      status: args.nextSlotDates.length === 0 ? "CANCELLED" : args.template.status,
      updatedAt: args.now,
    });
  });
}
