import type { Prisma as PrismaTypes } from "generated/prisma/client";

export const stationSelect = {
  id: true,
  name: true,
  address: true,
  stationType: true,
  agencyId: true,
  totalCapacity: true,
  returnSlotLimit: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type StationBaseRow = PrismaTypes.StationGetPayload<{
  select: typeof stationSelect;
}>;
