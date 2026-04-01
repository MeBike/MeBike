import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { makeRedistributionAdminReadRepository } from "./redistribution.admin-read.repository";
import { makeRedistributionStaffReadRepository } from "./redistribution.staff-read.repository";

export type RedistributionReadRepo = Pick<
  RedistributionRepo,
  | "listMyInStationRequests"
  | "getMyInStationRequest"
  | "findById"
  | "adminListRequests"
>;

export function makeRedistributionReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionReadRepo {
  return {
    ...makeRedistributionStaffReadRepository(client),
    ...makeRedistributionAdminReadRepository(client),
  };
}
