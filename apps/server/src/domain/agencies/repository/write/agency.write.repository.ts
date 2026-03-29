import { Effect } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { AgencyRepo } from "../agency.repository.types";

import { AgencyRepositoryError } from "../../domain-errors";
import { selectAgencyRow, toAgencyRow } from "../agency.repository.helpers";

export type AgencyWriteRepo = Pick<AgencyRepo, "create">;

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
