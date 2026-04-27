import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { ReturnSlotRow } from "../models";

export const returnSlotSelect = {
  id: true,
  rentalId: true,
  userId: true,
  stationId: true,
  reservedFrom: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ReturnSlotSelectRow = PrismaTypes.ReturnSlotReservationGetPayload<{
  select: typeof returnSlotSelect;
}>;

export function mapToReturnSlotRow(raw: ReturnSlotSelectRow): ReturnSlotRow {
  return raw;
}
