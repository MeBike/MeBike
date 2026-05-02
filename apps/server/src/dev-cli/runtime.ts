import { Cause, Effect, Either, Exit, ManagedRuntime, Option } from "effect";

import "./env-bootstrap";

import type { PrismaClient } from "generated/prisma/client";

import {
  NfcCardCommandServiceTag,
  NfcCardQueryServiceTag,
} from "../domain/nfc-cards";
import { expireReturnSlots, RentalCommandServiceTag, returnSlotExpiresAt } from "../domain/rentals";
import {
  NfcCardCommandServiceLayer,
  NfcCardQueryServiceLayer,
  PrismaLive,
  RentalCommandServiceLayer,
  ReturnSlotReposLive,
} from "../http/shared/providers";
import { Prisma } from "../infrastructure/prisma";
import { notifyReturnSlotExpired } from "../realtime/return-slot-events";

const rentalCommandRuntime = ManagedRuntime.make(RentalCommandServiceLayer);
const nfcCardCommandRuntime = ManagedRuntime.make(NfcCardCommandServiceLayer);
const nfcCardQueryRuntime = ManagedRuntime.make(NfcCardQueryServiceLayer);
const prismaRuntime = ManagedRuntime.make(PrismaLive);
const returnSlotRuntime = ManagedRuntime.make(ReturnSlotReposLive);

export async function disposeCliRuntimes() {
  await Promise.allSettled([
    rentalCommandRuntime.dispose(),
    nfcCardCommandRuntime.dispose(),
    nfcCardQueryRuntime.dispose(),
    prismaRuntime.dispose(),
    returnSlotRuntime.dispose(),
  ]);
}

export async function expireReturnSlotsForDev(args: {
  now: Date;
  notify: boolean;
}) {
  const summary = await returnSlotRuntime.runPromise(expireReturnSlots({ now: args.now }));

  if (args.notify) {
    await Promise.all(summary.expiredSlots.map(slot =>
      notifyReturnSlotExpired({
        userId: slot.userId,
        rentalId: slot.rentalId,
        returnSlotId: slot.id,
        stationId: slot.stationId,
        reservedFrom: slot.reservedFrom.toISOString(),
        expiredAt: returnSlotExpiresAt(slot.reservedFrom).toISOString(),
        at: args.now.toISOString(),
      }),
    ));
  }

  return summary;
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
  if (args.nfcCardUid === null) {
    const existingCard = await nfcCardQueryRuntime.runPromise(
      Effect.flatMap(NfcCardQueryServiceTag, service => service.findByAssignedUserId(args.userId)),
    );

    if (Option.isNone(existingCard)) {
      return { nfcCardUid: null };
    }

    const result = await nfcCardCommandRuntime.runPromise(
      Effect.flatMap(NfcCardCommandServiceTag, service =>
        service.unassignCard({
          nfcCardId: existingCard.value.id,
          now: new Date(),
        })).pipe(Effect.either),
    );

    if (Either.isLeft(result)) {
      throw new Error(formatUserCardUpdateError(result.left, args));
    }

    return { nfcCardUid: null };
  }

  const card = await nfcCardQueryRuntime.runPromise(
    Effect.flatMap(NfcCardQueryServiceTag, service => service.findByUid(args.nfcCardUid!)),
  );

  const ensuredCard = Option.isSome(card)
    ? card.value
    : await nfcCardCommandRuntime.runPromise(
        Effect.flatMap(NfcCardCommandServiceTag, service => service.createCard({ uid: args.nfcCardUid! })),
      );

  const result = await nfcCardCommandRuntime.runPromise(
    Effect.flatMap(NfcCardCommandServiceTag, service =>
      service.assignCard({
        nfcCardId: ensuredCard.id,
        userId: args.userId,
        now: new Date(),
      })).pipe(Effect.either),
  );

  if (Either.isLeft(result)) {
    throw new Error(formatUserCardUpdateError(result.left, args));
  }

  return { nfcCardUid: result.right.uid };
}

function formatUserCardUpdateError(
  error: unknown,
  args: { userId: string; nfcCardUid: string | null },
) {
  const taggedError = typeof error === "object" && error !== null ? error as Record<string, unknown> : null;
  const tag = typeof taggedError?._tag === "string" ? taggedError._tag : null;
  const message = typeof taggedError?.message === "string" ? taggedError.message : null;
  const operation = typeof taggedError?.operation === "string" ? taggedError.operation : null;

  return [
    `Failed to update NFC card for user ${args.userId}`,
    `cardUid=${args.nfcCardUid ?? "null"}`,
    tag ? `error=${tag}` : null,
    operation ? `operation=${operation}` : null,
    message ? `message=${message}` : null,
  ].filter(Boolean).join("; ");
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
