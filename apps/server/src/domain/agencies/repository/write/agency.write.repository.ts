import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { AgencyRepo } from "../agency.repository.types";

import { AgencyRepositoryError } from "../../domain-errors";
import { selectAgencyRow, toAgencyRow } from "../agency.repository.helpers";

export type AgencyWriteRepo = Pick<AgencyRepo, "create" | "update" | "updateStatus">;

export function makeAgencyWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): AgencyWriteRepo {
  return {
    create: input =>
      Effect.tryPromise({
        try: () =>
          client.agency.create({
            data: {
              name: input.name,
              contactPhone: input.contactPhone ?? null,
              status: input.status ?? "ACTIVE",
            },
            select: selectAgencyRow,
          }),
        catch: cause => new AgencyRepositoryError({ operation: "create", cause }),
      }).pipe(Effect.map(toAgencyRow)),
    update: (id, input) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.agency.findUnique({
              where: { id },
              select: selectAgencyRow,
            }),
          catch: cause =>
            new AgencyRepositoryError({
              operation: "update.findExisting",
              cause,
            }),
        });

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.agency.update({
              where: { id },
              data: {
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.contactPhone !== undefined
                  ? { contactPhone: input.contactPhone }
                  : {}),
                ...(input.status !== undefined ? { status: input.status } : {}),
              },
              select: selectAgencyRow,
            }),
          catch: cause =>
            new AgencyRepositoryError({
              operation: "update",
              cause,
            }),
        });

        return Option.some(toAgencyRow(updated));
      }),
    updateStatus: (id, input) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.agency.findUnique({
              where: { id },
              select: selectAgencyRow,
            }),
          catch: cause =>
            new AgencyRepositoryError({
              operation: "updateStatus.findExisting",
              cause,
            }),
        });

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.agency.update({
              where: { id },
              data: {
                status: input.status,
              },
              select: selectAgencyRow,
            }),
          catch: cause =>
            new AgencyRepositoryError({
              operation: "updateStatus",
              cause,
            }),
        });

        return Option.some(toAgencyRow(updated));
      }),
  };
}
