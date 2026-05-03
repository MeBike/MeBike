import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { pickDefined } from "@/domain/shared/pick-defined";

import type { StationFilter, StationSortField } from "../models";

export function toStationOrderBy(
  req: PageRequest<StationSortField>,
): PrismaTypes.StationOrderByWithRelationInput {
  const sortBy: StationSortField = req.sortBy ?? "name";
  const sortDir = req.sortDir ?? "asc";

  switch (sortBy) {
    case "totalCapacity":
      return { totalCapacity: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "name":
    default:
      return { name: sortDir };
  }
}

export function toStationWhere(filter: StationFilter): PrismaTypes.StationWhereInput {
  return {
    ...pickDefined({
      id: filter.id,
      name: filter.name
        ? { contains: filter.name, mode: "insensitive" }
        : undefined,
      address: filter.address
        ? { contains: filter.address, mode: "insensitive" }
        : undefined,
      stationType: filter.stationType,
      agencyId: filter.agencyId,
      totalCapacity: filter.totalCapacity,
    }),
    ...(filter.excludeAssignedStaff && {
      userAssignments: {
        none: {
          user: {
            role: "STAFF",
          },
        },
      },
    }),
  };
}
