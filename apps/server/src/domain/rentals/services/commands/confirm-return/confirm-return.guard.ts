import { Effect, Option } from "effect";

import type { OvernightOperationsClosed } from "@/domain/shared";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { isWithinOvernightOperationsWindow, makeOvernightOperationsClosedError } from "@/domain/shared";
import { StationNotFound } from "@/domain/stations";

import type { RentalRow } from "../../../models";
import type { ConfirmRentalReturnInput } from "../../../types";
import type { ConfirmReturnOperatorScope } from "./confirm-return.types";

import {
  InvalidRentalState,
  RentalNotFound,
  RentalRepositoryError,
  ReturnAlreadyConfirmed,
  ReturnSlotCapacityExceeded,
  UnauthorizedRentalAccess,
} from "../../../domain-errors";
import { makeRentalRepository } from "../../../repository/rental.repository";
import { makeReturnSlotRepository } from "../../../repository/return-slot.repository";
import { makeRentalReturnConfirmationWriteRepository } from "../../../repository/write/rental.return-confirmation-write.repository";
import { returnSlotActiveAfter } from "../return-slot-expiry";

/**
 * Nạp rental cần xác nhận và chặn sớm nếu rental không còn ở trạng thái đang thuê.
 */
export function loadConfirmableRentalInTx(
  tx: PrismaTypes.TransactionClient,
  rentalId: string,
): Effect.Effect<RentalRow, RentalNotFound | InvalidRentalState> {
  return Effect.gen(function* () {
    const txRentalRepo = makeRentalRepository(tx);
    const rentalOpt = yield* txRentalRepo.findById(rentalId);

    if (Option.isNone(rentalOpt)) {
      return yield* Effect.fail(new RentalNotFound({
        rentalId,
        userId: "unknown",
      }));
    }

    const rental = rentalOpt.value;
    if (rental.status !== "RENTED") {
      return yield* Effect.fail(new InvalidRentalState({
        rentalId: rental.id,
        from: rental.status,
        to: "COMPLETED",
      }));
    }

    return rental;
  });
}

/**
 * Resolve phạm vi quyền của operator đang xác nhận trả xe.
 */
export function resolveConfirmReturnOperatorInTx(
  tx: PrismaTypes.TransactionClient,
  input: ConfirmRentalReturnInput,
): Effect.Effect<ConfirmReturnOperatorScope | null, RentalRepositoryError> {
  return Effect.tryPromise({
    try: async () => {
      if (
        input.operatorRole
        && (input.operatorRole === "STAFF"
          || input.operatorRole === "AGENCY")
      ) {
        return {
          role: input.operatorRole,
          stationId: input.operatorStationId ?? null,
          agencyId: input.operatorAgencyId ?? null,
        } satisfies ConfirmReturnOperatorScope;
      }

      const user = await tx.user.findUnique({
        where: { id: input.confirmedByUserId },
        select: {
          role: true,
          orgAssignment: {
            select: {
              stationId: true,
              agencyId: true,
            },
          },
        },
      });

      return user
        ? {
            role: user.role,
            stationId: user.orgAssignment?.stationId ?? null,
            agencyId: user.orgAssignment?.agencyId ?? null,
          }
        : null;
    },
    catch: cause =>
      new RentalRepositoryError({
        operation: "confirmRentalReturnByOperator.findOperator",
        cause,
      }),
  });
}

/**
 * Chỉ cho phép operator xác nhận ở phạm vi station hoặc agency mà họ quản lý.
 */
export function ensureOperatorCanConfirmReturnInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: ConfirmRentalReturnInput;
  readonly rental: RentalRow;
  readonly operator: ConfirmReturnOperatorScope | null;
}): Effect.Effect<void, OvernightOperationsClosed | UnauthorizedRentalAccess | RentalRepositoryError> {
  return Effect.gen(function* () {
    const { tx, input, rental, operator } = args;
    const now = input.now ?? new Date();
    const operatorRole = operator?.role ?? input.operatorRole;

    if (
      (operatorRole === "STAFF" || operatorRole === "AGENCY")
      && isWithinOvernightOperationsWindow(now)
    ) {
      return yield* Effect.fail(makeOvernightOperationsClosedError(now));
    }

    if (operator?.role !== "AGENCY") {
      return;
    }

    const station = yield* Effect.tryPromise({
      try: () =>
        tx.station.findUnique({
          where: { id: input.stationId },
          select: { agencyId: true },
        }),
      catch: cause =>
        new RentalRepositoryError({
          operation: "confirmRentalReturnByOperator.findStationAgency",
          cause,
        }),
    });

    if (!station || !operator.agencyId || station.agencyId !== operator.agencyId) {
      return yield* Effect.fail(new UnauthorizedRentalAccess({
        rentalId: rental.id,
        userId: input.confirmedByUserId,
      }));
    }
  });
}

/**
 * Xác nhận rằng station trả xe hiện tại vẫn hợp lệ cho rental này.
 *
 * Return slot chỉ giữ chỗ tại station đó. Nếu trả đúng station đã giữ, bỏ qua
 * capacity check. Nếu trả station khác, slot sẽ được hủy khi hoàn tất trả xe
 * và station nhận xe vẫn phải còn chỗ vật lý.
 */
export function ensureReturnDestinationReadyInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: ConfirmRentalReturnInput;
  readonly rental: RentalRow;
}): Effect.Effect<void, ReturnSlotCapacityExceeded | StationNotFound> {
  return Effect.gen(function* () {
    const txReturnSlotRepo = makeReturnSlotRepository(args.tx);
    const now = args.input.now ?? new Date();
    const activeAfter = returnSlotActiveAfter(now);

    yield* txReturnSlotRepo.cancelActiveByRentalIdOlderThan(
      args.rental.id,
      activeAfter,
      args.input.confirmedAt,
    );

    const activeReturnSlotOpt = yield* txReturnSlotRepo.findUnexpiredActiveByRentalId(args.rental.id, activeAfter);

    if (Option.isSome(activeReturnSlotOpt)) {
      const activeReturnSlot = activeReturnSlotOpt.value;

      if (activeReturnSlot.stationId === args.input.stationId) {
        return;
      }

      yield* txReturnSlotRepo.finalizeActiveByRentalId(
        args.rental.id,
        "CANCELLED",
        args.input.confirmedAt,
      );
    }

    const stationSnapshotOpt = yield* txReturnSlotRepo.getStationCapacitySnapshot(args.input.stationId, activeAfter);

    if (Option.isNone(stationSnapshotOpt)) {
      return yield* Effect.fail(new StationNotFound({ id: args.input.stationId }));
    }

    const stationSnapshot = stationSnapshotOpt.value;
    const physicalRemaining = stationSnapshot.totalCapacity
      - stationSnapshot.totalBikes
      - stationSnapshot.activeReturnSlots;

    if (physicalRemaining <= 0) {
      return yield* Effect.fail(new ReturnSlotCapacityExceeded({
        stationId: args.input.stationId,
        totalCapacity: stationSnapshot.totalCapacity,
        returnSlotLimit: stationSnapshot.returnSlotLimit,
        totalBikes: stationSnapshot.totalBikes,
        activeReturnSlots: stationSnapshot.activeReturnSlots,
      }));
    }
  });
}

/**
 * Tạo bản ghi confirmation và map trường hợp đua tranh về lỗi domain dễ hiểu.
 */
export function createReturnConfirmationInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: ConfirmRentalReturnInput;
  readonly rental: RentalRow;
}): Effect.Effect<void, ReturnAlreadyConfirmed> {
  return Effect.gen(function* () {
    const txReturnConfirmationRepo = makeRentalReturnConfirmationWriteRepository(args.tx);
    const existingConfirmationOpt = yield* txReturnConfirmationRepo.findReturnConfirmationByRentalId(args.rental.id);

    if (Option.isSome(existingConfirmationOpt)) {
      return yield* Effect.fail(new ReturnAlreadyConfirmed({
        rentalId: args.rental.id,
      }));
    }

    yield* txReturnConfirmationRepo.createReturnConfirmation({
      rentalId: args.rental.id,
      stationId: args.input.stationId,
      confirmedByUserId: args.input.confirmedByUserId,
      confirmationMethod: args.input.confirmationMethod,
      handoverStatus: "CONFIRMED",
      confirmedAt: args.input.confirmedAt,
    }).pipe(
      Effect.catchTag("ReturnConfirmationUniqueViolation", () =>
        Effect.fail(new ReturnAlreadyConfirmed({ rentalId: args.rental.id }))),
    );
  });
}
