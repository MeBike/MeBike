import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { makeRedistributionCoreReadRepository } from "./redistribution.core-read.repository";
import { makeRedistributionStaffReadRepository } from "./redistribution.staff-read.repository";

export type RedistributionReadRepo = Pick<
  RedistributionRepo,
  | "listMyInStationRequests"
  | "getMyInStationRequest"
  | "findById"
  | "findOne"
  | "findAndPopulate"
  | "listWithOffset"
>;

export function makeRedistributionReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionReadRepo {
  return {
    ...makeRedistributionCoreReadRepository(client),
    ...makeRedistributionStaffReadRepository(client),
  };
}
