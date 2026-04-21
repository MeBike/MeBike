import { Cause, Effect, Exit, ManagedRuntime, Option } from "effect";

import "./env-bootstrap";

import type { PrismaClient } from "generated/prisma/client";

import { RentalCommandServiceTag } from "../domain/rentals";
import { UserCommandServiceTag } from "../domain/users";
import {
  PrismaLive,
  RentalCommandServiceLayer,
  UserCommandServiceLayer,
} from "../http/shared/providers";
import { Prisma } from "../infrastructure/prisma";

const rentalCommandRuntime = ManagedRuntime.make(RentalCommandServiceLayer);
const prismaRuntime = ManagedRuntime.make(PrismaLive);
const userCommandRuntime = ManagedRuntime.make(UserCommandServiceLayer);

export async function disposeCliRuntimes() {
  await Promise.allSettled([
    rentalCommandRuntime.dispose(),
    prismaRuntime.dispose(),
    userCommandRuntime.dispose(),
  ]);
}

export async function confirmRentalReturnByStaff(args: {
  rentalId: string;
  staffUserId: string;
  stationId: string;
}) {
  const exit = await rentalCommandRuntime.runPromiseExit(
    Effect.flatMap(RentalCommandServiceTag, rentalCommandService =>
      rentalCommandService.confirmReturnByOperator({
        rentalId: args.rentalId,
        stationId: args.stationId,
        confirmedByUserId: args.staffUserId,
        operatorRole: "STAFF",
        operatorStationId: args.stationId,
        confirmationMethod: "MANUAL",
        confirmedAt: new Date(),
      })),
  );

  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  if (Cause.isFailType(exit.cause)) {
    throw new Error(formatConfirmRentalReturnError(exit.cause.error, args));
  }

  throw new Error(`Failed to confirm rental return: ${Cause.pretty(exit.cause)}`);
}

export async function updateUserCardUid(args: {
  userId: string;
  nfcCardUid: string | null;
}) {
  const updated = await userCommandRuntime.runPromise(
    Effect.flatMap(UserCommandServiceTag, userCommandService =>
      userCommandService.updateAdminById(args.userId, {
        nfcCardUid: args.nfcCardUid,
      })),
  );

  if (Option.isNone(updated)) {
    throw new Error(`Failed to update user card uid: ${args.userId}`);
  }

  return updated.value;
}

export async function withPrismaClient<T>(
  task: (client: PrismaClient) => Promise<T>,
) {
  return prismaRuntime.runPromise(
    Effect.flatMap(Prisma, prisma =>
      Effect.promise(() => task(prisma.client))),
  );
}

function formatConfirmRentalReturnError(
  error: unknown,
  args: { rentalId: string; stationId: string; staffUserId: string },
) {
  const taggedError = typeof error === "object" && error !== null ? error as Record<string, unknown> : null;
  const tag = typeof taggedError?._tag === "string" ? taggedError._tag : null;

  if (tag === "UnauthorizedRentalAccess") {
    return `Staff ${args.staffUserId} cannot end rental ${args.rentalId} at station ${args.stationId}.`;
  }

  if (tag === "ReturnSlotStationMismatch") {
    return `Rental ${args.rentalId} has an active return slot for station ${String(taggedError?.returnSlotStationId)}, not ${String(taggedError?.attemptedEndStationId)}.`;
  }

  if (tag === "ReturnSlotCapacityExceeded") {
    return `Station ${String(taggedError?.stationId)} cannot accept this return. Capacity ${String(taggedError?.totalBikes)}/${String(taggedError?.totalCapacity)} with ${String(taggedError?.activeReturnSlots)} active return slots.`;
  }

  if (tag === "ReturnAlreadyConfirmed") {
    return `Rental ${args.rentalId} was already confirmed as returned.`;
  }

  if (tag === "InvalidRentalState") {
    const from = String(taggedError?.from);
    const to = String(taggedError?.to);

    if (to === "OVERDUE_UNRETURNED") {
      return `Rental ${args.rentalId} can no longer be closed by staff because it has passed the allowed return window and must move to OVERDUE_UNRETURNED.`;
    }

    return `Rental ${args.rentalId} is ${from} and cannot transition to ${to}.`;
  }

  if (tag === "RentalNotFound") {
    return `Rental ${args.rentalId} was not found.`;
  }

  if (tag === "StationNotFound") {
    return `Station ${String(taggedError?.id)} was not found.`;
  }

  if (tag === "OvernightOperationsClosed") {
    return `Operations are closed at ${String(taggedError?.currentTime)}. Allowed hours: ${String(taggedError?.windowStart)} to ${String(taggedError?.windowEnd)}.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (tag) {
    return `Failed to confirm rental return: ${tag}`;
  }

  return `Failed to confirm rental return: ${String(error)}`;
}
