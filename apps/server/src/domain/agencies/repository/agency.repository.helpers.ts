import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { AgencyFilter, AgencySortField } from "../models";

const selectAgencyRow = {
  id: true,
  name: true,
  contactPhone: true,
  status: true,
  station: {
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      stationType: true,
      totalCapacity: true,
      returnSlotLimit: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.AgencySelect;

export function toAgencyRow(
  row: PrismaTypes.AgencyGetPayload<{ select: typeof selectAgencyRow }>,
) {
  return {
    id: row.id,
    name: row.name,
    contactPhone: row.contactPhone,
    status: row.status,
    station: row.station
      ? {
          id: row.station.id,
          name: row.station.name,
          address: row.station.address,
          latitude: row.station.latitude,
          longitude: row.station.longitude,
          stationType: row.station.stationType,
          totalCapacity: row.station.totalCapacity,
          returnSlotLimit: row.station.returnSlotLimit,
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAgencyWhere(filter: AgencyFilter): PrismaTypes.AgencyWhereInput {
  return {
    ...(filter.name
      ? {
          name: {
            contains: filter.name,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filter.stationAddress
      ? {
          station: {
            address: {
              contains: filter.stationAddress,
              mode: "insensitive",
            },
          },
        }
      : {}),
    ...(filter.contactPhone
      ? {
          contactPhone: {
            contains: filter.contactPhone,
          },
        }
      : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };
}

export function toAgencyOrderBy(pageReq: {
  readonly sortBy?: AgencySortField;
  readonly sortDir?: "asc" | "desc";
}): PrismaTypes.AgencyOrderByWithRelationInput {
  const direction = pageReq.sortDir ?? "asc";

  switch (pageReq.sortBy) {
    case "status":
      return { status: direction };
    case "createdAt":
      return { createdAt: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "name":
    default:
      return { name: direction };
  }
}

export { selectAgencyRow };
