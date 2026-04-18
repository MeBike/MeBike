import type { PageRequest } from "@/domain/shared/pagination";
import type { BikeStatus, PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import type { BikeSortField } from "../models";

import { formatBikeNumber } from "../bike-number";

export type BikeDbClient = PrismaClient | PrismaTypes.TransactionClient;

export const bikeSelect = {
  id: true,
  bikeNumber: true,
  stationId: true,
  supplierId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type BikeSelectRow = PrismaTypes.BikeGetPayload<{
  select: typeof bikeSelect;
}>;

export function findBikeById(tx: BikeDbClient, bikeId: string) {
  return tx.bike.findUnique({ where: { id: bikeId }, select: bikeSelect });
}

export function toBikeOrderBy(
  req: PageRequest<BikeSortField>,
): PrismaTypes.BikeOrderByWithRelationInput {
  const sortBy: BikeSortField = req.sortBy ?? "status";
  const sortDir = req.sortDir ?? "asc";

  switch (sortBy) {
    case "name":
      return { bikeNumber: sortDir };
    case "status":
    default:
      return { status: sortDir };
  }
}

export async function getNextBikeNumber(tx: BikeDbClient): Promise<string> {
  const [counter] = await tx.$queryRaw<Array<{ value: bigint }>>`
    SELECT nextval('bike_number_seq')::bigint AS value
  `;

  if (!counter) {
    throw new Error("Failed to get next bike number value");
  }

  return formatBikeNumber(Number(counter.value));
}

export async function setBikeNumberSequence(tx: BikeDbClient, value: number): Promise<void> {
  await tx.$executeRaw`
    SELECT setval('bike_number_seq', ${value}, true)
  `;
}

export function buildStatusUpdate(status: BikeStatus, updatedAt: Date) {
  return { status, updatedAt };
}
