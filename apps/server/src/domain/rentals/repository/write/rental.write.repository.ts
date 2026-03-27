import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RentalRepo } from "../rental.repository.types";

import { makeRentalRentalWriteRepository } from "./rental.rental-write.repository";

export type RentalWriteRepo = Pick<
  RentalRepo,
  "createRental" | "updateRentalDepositHold" | "updateRentalOnEnd"
>;

export function makeRentalWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalWriteRepo {
  return {
    ...makeRentalRentalWriteRepository(client),
  };
}
