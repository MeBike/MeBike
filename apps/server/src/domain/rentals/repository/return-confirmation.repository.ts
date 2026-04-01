import { Effect, Layer, Match, Option } from "effect";

import type {
  ConfirmationMethod,
  HandoverStatus,
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { ReturnConfirmationRepoError } from "../domain-errors";
import type { ReturnConfirmationRow } from "../models";

import {
  RentalRepositoryError,
  ReturnConfirmationUniqueViolation,
} from "../domain-errors";
import { uniqueTargets } from "./unique-violation";

type CreateReturnConfirmationInput = {
  rentalId: string;
  stationId: string;
  confirmedByUserId: string;
  confirmationMethod: ConfirmationMethod;
  handoverStatus: HandoverStatus;
  confirmedAt: Date;
};

export type ReturnConfirmationRepo = {
  findByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<ReturnConfirmationRow>>;
  create: (
    input: CreateReturnConfirmationInput,
  ) => Effect.Effect<ReturnConfirmationRow, ReturnConfirmationRepoError>;
};

const returnConfirmationSelect = {
  id: true,
  rentalId: true,
  stationId: true,
  agencyId: true,
  confirmedByUserId: true,
  confirmationMethod: true,
  handoverStatus: true,
  confirmedAt: true,
  createdAt: true,
} as const;

function mapToReturnConfirmationRow(raw: {
  id: string;
  rentalId: string;
  stationId: string | null;
  agencyId: string | null;
  confirmedByUserId: string;
  confirmationMethod: ConfirmationMethod;
  handoverStatus: HandoverStatus;
  confirmedAt: Date;
  createdAt: Date;
}): ReturnConfirmationRow {
  return raw;
}

export function makeReturnConfirmationRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): ReturnConfirmationRepo {
  const client = db;

  return {
    findByRentalId: rentalId =>
      Effect.tryPromise({
        try: () =>
          client.returnConfirmation.findUnique({
            where: { rentalId },
            select: returnConfirmationSelect,
          }),
        catch: cause =>
          new RentalRepositoryError({
            operation: "returnConfirmation.findByRentalId",
            cause,
          }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(mapToReturnConfirmationRow))),
        defectOn(RentalRepositoryError),
      ),

    create: input =>
      Effect.tryPromise({
        try: () =>
          client.returnConfirmation.create({
            data: {
              rentalId: input.rentalId,
              stationId: input.stationId,
              agencyId: null,
              confirmedByUserId: input.confirmedByUserId,
              confirmationMethod: input.confirmationMethod,
              handoverStatus: input.handoverStatus,
              confirmedAt: input.confirmedAt,
            },
            select: returnConfirmationSelect,
          }),
        catch: cause =>
          Match.value(cause).pipe(
            Match.when(
              isPrismaUniqueViolation,
              error =>
                new ReturnConfirmationUniqueViolation({
                  operation: "returnConfirmation.create",
                  constraint: uniqueTargets(error),
                  cause: error,
                }),
            ),
            Match.orElse(
              error =>
                new RentalRepositoryError({
                  operation: "returnConfirmation.create",
                  cause: error,
                }),
            ),
          ),
      }).pipe(
        Effect.map(mapToReturnConfirmationRow),
        defectOn(RentalRepositoryError),
      ),
  };
}

const makeReturnConfirmationRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeReturnConfirmationRepository(client);
});

export class ReturnConfirmationRepository extends Effect.Service<ReturnConfirmationRepository>()(
  "ReturnConfirmationRepository",
  {
    effect: makeReturnConfirmationRepositoryEffect,
  },
) {}

export const ReturnConfirmationRepositoryLive = Layer.effect(
  ReturnConfirmationRepository,
  makeReturnConfirmationRepositoryEffect.pipe(Effect.map(ReturnConfirmationRepository.make)),
);
