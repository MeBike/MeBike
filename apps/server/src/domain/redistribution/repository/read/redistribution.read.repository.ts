import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { makeRedistributionAdminReadRepository } from "./redistribution.admin-read.repository";
import { makeRedistributionCoreReadRepository } from "./redistribution.core-read.repository";
import { makeRedistributionStaffReadRepository } from "./redistribution.staff-read.repository";

export type RedistributionReadRepo = Pick<
  RedistributionRepo,
  | "listMyInStationRequests"
  | "getMyInStationRequest"
  | "findById"
  | "find"
  | "adminListRequests"
  | "adminGetById"
>;

export function makeRedistributionReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionReadRepo {
  return {
    ...makeRedistributionCoreReadRepository(client),
    ...makeRedistributionStaffReadRepository(client),
    ...makeRedistributionAdminReadRepository(client),
  };
}
