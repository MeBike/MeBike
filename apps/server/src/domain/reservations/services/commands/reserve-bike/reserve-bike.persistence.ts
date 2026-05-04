import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import type { SubscriptionCommandService } from "@/domain/subscriptions/services/subscription.service.types";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { makeStationQueryRepository } from "@/domain/stations";
import { makeUserQueryRepository } from "@/domain/users";
import { makeWalletCommandRepository } from "@/domain/wallets";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { buildReservationConfirmedEmail } from "@/lib/email-templates";

import type { ReservationRow } from "../../../models";
import type { PreparedReserveBike, ReserveBikeCommandInput, ReserveBikeFailure } from "./reserve-bike.types";

import { BikeAlreadyReserved } from "../../../domain-errors";
import { makeReservationCommandRepository } from "../../../repository/reservation-command.repository";
import { mapReservationUniqueViolation } from "../../../repository/unique-violation";
import { scheduleReservationLifecycleJobsInTx } from "../../reservation-lifecycle-jobs";

const RESERVATION_TIME_ZONE = "Asia/Ho_Chi_Minh";

function formatReservationDateTime(value: Date): string {
  return value.toLocaleString("vi-VN", { timeZone: RESERVATION_TIME_ZONE });
}

/**
 * Ghi toàn bộ side effect cho flow reservation hold sau khi validation đã xong.
 *
 * File này gom các bước mutation vào một chỗ:
 * - thu tiền hoặc dùng subscription
 * - tạo reservation row
 * - đổi trạng thái bike sang reserved
 * - enqueue lifecycle jobs và email xác nhận
 *
 * @param args Dữ liệu mutation của flow reserve bike.
 * @param args.tx Transaction client đang dùng.
 * @param args.input Input reservation đã được chuẩn hóa `now`.
 * @param args.prepared Snapshot read-only đã validate xong.
 * @param args.subscriptionCommandService Service dùng subscription bên trong transaction hiện tại.
 */
export function persistReserveBikeInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: ReserveBikeCommandInput;
  readonly prepared: PreparedReserveBike;
  readonly subscriptionCommandService: SubscriptionCommandService;
}): Effect.Effect<ReservationRow, ReserveBikeFailure> {
  return Effect.gen(function* () {
    const { tx, input, prepared, subscriptionCommandService } = args;
    const txBikeRepo = makeBikeRepository(tx);
    const txReservationCommandRepo = makeReservationCommandRepository(tx);

    if (input.reservationOption === "SUBSCRIPTION") {
      yield* subscriptionCommandService.useOne(tx, {
        subscriptionId: prepared.subscriptionId!,
        userId: input.userId,
        now: input.now,
      });
    }
    else {
      yield* debitWallet(makeWalletCommandRepository(tx), {
        userId: input.userId,
        amount: prepared.prepaidMinor,
        description: `Reservation prepaid ${input.userId}`,
      });
    }

    const reservation = yield* txReservationCommandRepo.createReservation({
      userId: input.userId,
      bikeId: input.bikeId,
      stationId: input.stationId,
      pricingPolicyId: prepared.pricingPolicyId,
      reservationOption: input.reservationOption,
      subscriptionId: prepared.subscriptionId,
      startTime: input.startTime,
      endTime: prepared.endTime,
      prepaid: prepared.prepaid,
      status: "PENDING",
    }).pipe(
      Effect.catchTag("ReservationUniqueViolation", ({ constraint }) => {
        const mapped = mapReservationUniqueViolation({
          constraint,
          bikeId: input.bikeId,
          userId: input.userId,
        });

        if (mapped) {
          return Effect.fail(mapped);
        }

        return Effect.die(new Error(`Unhandled reservation unique constraint: ${String(constraint)}`));
      }),
    );

    const bikeReserved = yield* txBikeRepo.reserveBikeIfAvailable(input.bikeId, input.now);
    if (!bikeReserved) {
      return yield* Effect.fail(new BikeAlreadyReserved({ bikeId: input.bikeId }));
    }

    yield* scheduleReservationLifecycleJobsInTx(tx, reservation, input.now);
    yield* enqueueReservationConfirmationEmailInTx({
      tx,
      reservation,
      bikeId: input.bikeId,
      now: input.now,
      endTime: prepared.endTime,
    });

    return reservation;
  });
}

/**
 * Enqueue email xác nhận reservation sau khi transaction đã có đủ user + station + reservation data.
 *
 * @param args Dữ liệu cần để build và enqueue email xác nhận.
 * @param args.tx Transaction client đang dùng.
 * @param args.reservation Reservation vừa được tạo.
 * @param args.bikeId ID bike fallback nếu reservation row chưa phản chiếu đủ dữ liệu.
 * @param args.now Mốc hiện tại dùng cho `runAt`.
 * @param args.endTime Thời gian kết thúc hold để render email.
 */
function enqueueReservationConfirmationEmailInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly reservation: ReservationRow;
  readonly bikeId: string;
  readonly now: Date;
  readonly endTime: Date;
}): Effect.Effect<void> {
  return Effect.gen(function* () {
    const txUserRepo = makeUserQueryRepository(args.tx);
    const txStationRepo = makeStationQueryRepository(args.tx);
    const [userOpt, stationOpt] = yield* Effect.all([
      txUserRepo.findById(args.reservation.userId),
      txStationRepo.getById(args.reservation.stationId),
    ]);

    if (Option.isNone(userOpt)) {
      return yield* Effect.die(new Error(
        `Invariant violated: reservation ${args.reservation.id} references missing user ${args.reservation.userId}`,
      ));
    }
    if (Option.isNone(stationOpt)) {
      return yield* Effect.die(new Error(
        `Invariant violated: reservation ${args.reservation.id} references missing station ${args.reservation.stationId}`,
      ));
    }

    const email = buildReservationConfirmedEmail({
      fullName: userOpt.value.fullname,
      stationName: stationOpt.value.name,
      bikeId: args.reservation.bikeId ?? args.bikeId,
      startTimeLabel: formatReservationDateTime(args.reservation.startTime),
      endTimeLabel: formatReservationDateTime(args.endTime),
    });

    yield* enqueueOutboxJobInTx(args.tx, {
      type: JobTypes.EmailSend,
      payload: {
        version: 1,
        to: userOpt.value.email,
        kind: "raw",
        subject: email.subject,
        html: email.html,
      },
      runAt: args.now,
      dedupeKey: `reservation-confirm:${args.reservation.id}`,
    });
  });
}

/**
 * Trừ tiền ví cho prepaid reservation và map lỗi wallet thô sang lỗi domain của flow reservation.
 *
 * @param repo Wallet repository đang bám theo transaction hiện tại.
 * @param input Dữ liệu debit ví.
 * @param input.userId ID user bị trừ tiền.
 * @param input.amount Số tiền cần trừ.
 * @param input.description Mô tả transaction wallet.
 */
function debitWallet(
  repo: ReturnType<typeof makeWalletCommandRepository>,
  input: DecreaseBalanceInput,
): Effect.Effect<void, WalletNotFound | InsufficientWalletBalance> {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new WalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", err =>
      Effect.fail(new InsufficientWalletBalance({
        walletId: err.walletId,
        userId: err.userId,
        balance: err.balance,
        attemptedDebit: err.attemptedDebit,
      }))),
  );
}
