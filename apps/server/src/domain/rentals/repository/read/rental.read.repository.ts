import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RentalRepo } from "../rental.repository.types";

import { makeRentalAdminReadRepository } from "./rental.admin-read.repository";
import { makeRentalCoreReadRepository } from "./rental.core-read.repository";
import { makeRentalMyReadRepository } from "./rental.my-read.repository";

export type RentalReadRepo = Pick<
  RentalRepo,
  | "listMyRentals"
  | "listMyCurrentRentals"
  | "getMyRentalById"
  | "getMyRentalCounts"
  | "findActiveByBikeId"
  | "findActiveByUserId"
  | "findById"
  | "adminListRentals"
  | "adminGetRentalById"
  | "listActiveRentalsByPhone"
>;

export function makeRentalReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalReadRepo {
  return {
    ...makeRentalMyReadRepository(client),
    ...makeRentalCoreReadRepository(client),
    ...makeRentalAdminReadRepository(client),
  };
}
