import { Effect, Option } from "effect";

import type { DecreaseBalanceInput } from "@/domain/wallets/models";

import { env } from "@/config/env";
import {
  defectOn,
  isWithinOvernightOperationsWindow,
  makeOvernightOperationsClosedError,
} from "@/domain/shared";
import { StationNotFound } from "@/domain/stations";
import { makeWalletCommandRepository } from "@/domain/wallets/repository/wallet-command.repository";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalOperatingHourFailure } from "../../domain-errors";
import type { ReturnSlotRow } from "../../models";

import {
  InsufficientBalanceForReturnSlot,
  RentalNotFound,
  ReturnSlotCapacityExceeded,
  ReturnSlotNotFound,
  ReturnSlotRequiresActiveRental,
  UserWalletNotFound,
} from "../../domain-errors";
import { makeRentalRepository, RentalRepository } from "../../repository/rental.repository";
import {
  makeReturnSlotRepository,
  ReturnSlotRepository,
} from "../../repository/return-slot.repository";
import { returnSlotActiveAfter } from "./return-slot-expiry";

export type ReturnSlotFailure
  = | RentalNotFound
    | ReturnSlotRequiresActiveRental
    | ReturnSlotNotFound
    | ReturnSlotCapacityExceeded
    | UserWalletNotFound
    | InsufficientBalanceForReturnSlot
    | StationNotFound
    | ReturnSlotOperatingHourFailure;

type ReturnSlotOperatingHourFailure = RentalOperatingHourFailure;

type ReturnSlotInput = {
  rentalId: string;
  userId: string;
  stationId: string;
  now?: Date;
};

type RentalScopedInput = {
  rentalId: string;
  userId: string;
  now?: Date;
};

function availableReturnSlots(
  totalCapacity: number,
  totalBikes: number,
  activeReturnSlots: number,
  returnSlotLimit: number,
  incomingRedistributionBikes: number,
) {
  const physicalRemaining = totalCapacity - totalBikes - activeReturnSlots - incomingRedistributionBikes;
  const operationalRemaining = returnSlotLimit - activeReturnSlots - incomingRedistributionBikes;
  return Math.min(physicalRemaining, operationalRemaining);
}

function debitReturnSlotFee(
  repo: ReturnType<typeof makeWalletCommandRepository>,
  input: DecreaseBalanceInput,
): Effect.Effect<void, UserWalletNotFound | InsufficientBalanceForReturnSlot> {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new UserWalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", err =>
      Effect.fail(new InsufficientBalanceForReturnSlot({
        userId: input.userId,
        requiredBalance: Number(err.attemptedDebit),
        currentBalance: Number(err.balance),
      }))),
    Effect.asVoid,
  );
}

/**
 * Tạo hoặc chuyển return slot hiện tại của user cho một rental đang diễn ra.
 *
 * Flow này chủ động dọn các slot đã quá hạn của cùng rental trước khi:
 * - tái sử dụng slot còn hiệu lực ở cùng station,
 * - kiểm tra capacity station đích,
 * - hoặc chuyển slot sang station mới.
 *
 * @param input `rentalId`, `userId`, `stationId` và thời điểm `now` tùy chọn để
 * xác định cửa sổ hiệu lực của slot.
 */
export function createReturnSlot(
  input: ReturnSlotInput,
): Effect.Effect<
  ReturnSlotRow,
  ReturnSlotFailure,
  Prisma | RentalRepository | ReturnSlotRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    const now = input.now ?? new Date();
    const activeAfter = returnSlotActiveAfter(now);

    if (isWithinOvernightOperationsWindow(now)) {
      return yield* Effect.fail(makeOvernightOperationsClosedError(now));
    }

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const rentalRepo = makeRentalRepository(tx);
        const returnSlotRepo = makeReturnSlotRepository(tx);
        const walletRepo = makeWalletCommandRepository(tx);

        const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId);

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const rental = rentalOpt.value;
        if (rental.status !== "RENTED") {
          return yield* Effect.fail(new ReturnSlotRequiresActiveRental({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        yield* returnSlotRepo.cancelActiveByRentalIdOlderThan(
          input.rentalId,
          activeAfter,
          now,
        );

        const existing = yield* returnSlotRepo.findUnexpiredActiveByRentalId(
          input.rentalId,
          activeAfter,
        );

        if (Option.isSome(existing) && existing.value.stationId === input.stationId) {
          return existing.value;
        }

        const stationSnapshotOpt = yield* returnSlotRepo.getStationCapacitySnapshot(input.stationId, activeAfter);

        if (Option.isNone(stationSnapshotOpt)) {
          return yield* Effect.fail(new StationNotFound({ id: input.stationId }));
        }

        const stationSnapshot = stationSnapshotOpt.value;
        if (availableReturnSlots(
          stationSnapshot.totalCapacity,
          stationSnapshot.totalBikes,
          stationSnapshot.activeReturnSlots,
          stationSnapshot.returnSlotLimit,
          stationSnapshot.incomingRedistributionBikes,
        ) <= 0) {
          return yield* Effect.fail(new ReturnSlotCapacityExceeded({
            stationId: input.stationId,
            totalCapacity: stationSnapshot.totalCapacity,
            returnSlotLimit: stationSnapshot.returnSlotLimit,
            totalBikes: stationSnapshot.totalBikes,
            activeReturnSlots: stationSnapshot.activeReturnSlots,
            incomingRedistributionBikes: stationSnapshot.incomingRedistributionBikes,
          }));
        }

        if (Option.isSome(existing)) {
          yield* returnSlotRepo.cancelActiveByRentalId(input.rentalId, now);
        }

        const createResult = yield* returnSlotRepo.createActive({
          rentalId: input.rentalId,
          userId: input.userId,
          stationId: input.stationId,
          reservedFrom: now,
        }).pipe(
          Effect.map(slot => ({ slot, created: true as const })),
          Effect.catchTag("ReturnSlotUniqueViolation", () =>
            returnSlotRepo.findActiveByRentalId(input.rentalId).pipe(
              Effect.flatMap(activeOpt =>
                Option.isSome(activeOpt)
                  ? Effect.succeed({ slot: activeOpt.value, created: false as const })
                  // This is still treated as a defect on purpose: once we hit the known
                  // one-active-return-slot-per-rental unique constraint, rereading that
                  // active slot should always succeed. We do not have a meaningful recovery
                  // path here yet, so surfacing it as a typed domain error would only add
                  // noise without changing runtime behavior.
                  : Effect.die(new Error(
                      `Active return slot unique violation without persisted slot for rental ${input.rentalId}`,
                    )),
              ),
            )),
        );

        if (createResult.created && env.RETURN_SLOT_RESERVATION_FEE_MINOR > 0) {
          const fee = BigInt(env.RETURN_SLOT_RESERVATION_FEE_MINOR);
          yield* debitReturnSlotFee(walletRepo, {
            userId: input.userId,
            amount: fee,
            description: `Return slot reservation ${createResult.slot.id}`,
            hash: `return-slot:${createResult.slot.id}:fee`,
            type: "DEBIT",
          });
        }

        return createResult.slot;
      })).pipe(
      defectOn(PrismaTransactionError),
    );
  });
}

/**
 * Lấy return slot hiện còn hiệu lực của rental đang diễn ra.
 *
 * Slot đã quá hạn nhưng chưa được worker sweep sẽ được coi như không tồn tại.
 *
 * @param input `rentalId`, `userId` và thời điểm `now` tùy chọn để đánh giá slot
 * còn nằm trong thời gian giữ chỗ hay không.
 */
export function getCurrentReturnSlot(
  input: RentalScopedInput,
): Effect.Effect<
  Option.Option<ReturnSlotRow>,
  RentalNotFound | ReturnSlotRequiresActiveRental,
  RentalRepository | ReturnSlotRepository
> {
  return Effect.gen(function* () {
    const rentalRepo = yield* RentalRepository;
    const returnSlotRepo = yield* ReturnSlotRepository;
    const now = input.now ?? new Date();
    const activeAfter = returnSlotActiveAfter(now);

    const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId);

    if (Option.isNone(rentalOpt)) {
      return yield* Effect.fail(new RentalNotFound({
        rentalId: input.rentalId,
        userId: input.userId,
      }));
    }

    const rental = rentalOpt.value;
    if (rental.status !== "RENTED") {
      return yield* Effect.fail(new ReturnSlotRequiresActiveRental({
        rentalId: rental.id,
        status: rental.status,
      }));
    }

    return yield* returnSlotRepo.findUnexpiredActiveByRentalId(input.rentalId, activeAfter);
  });
}

/**
 * Hủy return slot hiện còn hiệu lực của rental đang diễn ra.
 *
 * Nếu slot đã quá hạn trước khi request tới nơi, flow sẽ trả `ReturnSlotNotFound`
 * để phản ánh rằng không còn giữ chỗ hợp lệ nào để hủy.
 *
 * @param input `rentalId`, `userId` và thời điểm `now` tùy chọn để xác định slot
 * nào vẫn còn hợp lệ tại lúc request được xử lý.
 */
export function cancelReturnSlot(
  input: RentalScopedInput,
): Effect.Effect<
  ReturnSlotRow,
  RentalNotFound | ReturnSlotRequiresActiveRental | ReturnSlotNotFound,
  Prisma | RentalRepository | ReturnSlotRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    const now = input.now ?? new Date();

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const rentalRepo = makeRentalRepository(tx);
        const returnSlotRepo = makeReturnSlotRepository(tx);
        const activeAfter = returnSlotActiveAfter(now);

        const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId);

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const rental = rentalOpt.value;
        if (rental.status !== "RENTED") {
          return yield* Effect.fail(new ReturnSlotRequiresActiveRental({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        const active = yield* returnSlotRepo.findUnexpiredActiveByRentalId(input.rentalId, activeAfter);

        if (Option.isNone(active)) {
          return yield* Effect.fail(new ReturnSlotNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const cancelled = yield* returnSlotRepo.cancelActiveByRentalId(input.rentalId, now);

        if (Option.isNone(cancelled)) {
          return yield* Effect.fail(new ReturnSlotNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        return cancelled.value;
      })).pipe(
      defectOn(PrismaTransactionError),
    );
  });
}
