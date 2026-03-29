import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { CreateAgencyInput } from "../models";
import type { AgencyRow } from "../models";

import { AgencyRepositoryError } from "../domain-errors";

export type AgencyRepo = {
  readonly create: (input: CreateAgencyInput) => Effect.Effect<AgencyRow, AgencyRepositoryError>;
};

const selectAgencyRow = {
  id: true,
  name: true,
  address: true,
  contactPhone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.AgencySelect;

function toAgencyRow(
  row: PrismaTypes.AgencyGetPayload<{ select: typeof selectAgencyRow }>,
): AgencyRow {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    contactPhone: row.contactPhone,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const makeAgencyRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeAgencyRepository(client);
});

export class AgencyRepository extends Effect.Service<AgencyRepository>()(
  "AgencyRepository",
  {
    effect: makeAgencyRepositoryEffect,
  },
) {}

export function makeAgencyRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): AgencyRepo {
  return {
    create: input =>
      Effect.tryPromise({
        try: () =>
          client.agency.create({
            data: {
              name: input.name,
              address: input.address ?? null,
              contactPhone: input.contactPhone ?? null,
              status: input.status ?? "ACTIVE",
            },
            select: selectAgencyRow,
          }),
        catch: cause => new AgencyRepositoryError({ operation: "create", cause }),
      }).pipe(Effect.map(toAgencyRow)),
  };
}

export const AgencyRepositoryLive = Layer.effect(
  AgencyRepository,
  makeAgencyRepositoryEffect.pipe(Effect.map(AgencyRepository.make)),
);
