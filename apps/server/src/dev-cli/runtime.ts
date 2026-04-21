import { Effect, ManagedRuntime, Option } from "effect";

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
  return rentalCommandRuntime.runPromise(
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
