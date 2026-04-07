import { uuidv7 } from "uuidv7";

import { getNextBikeNumber } from "@/domain/bikes/repository/bike.repository.shared";

import type { BikeOverrides, CreatedBike, FactoryContext } from "./types";

const defaults = {
  stationId: null,
  supplierId: null,
  status: "AVAILABLE" as const,
};

export function createBikeFactory(ctx: FactoryContext) {
  let counter = 0;

  return async (overrides: BikeOverrides = {}): Promise<CreatedBike> => {
    counter++;
    const id = overrides.id ?? uuidv7();
    const bikeNumber = overrides.bikeNumber ?? await getNextBikeNumber(ctx.prisma);
    const chipId = overrides.chipId ?? `CHIP-${counter}-${id.slice(0, 8)}`;

    await ctx.prisma.bike.create({
      data: {
        id,
        bikeNumber,
        chipId,
        stationId: overrides.stationId ?? defaults.stationId,
        supplierId: overrides.supplierId ?? defaults.supplierId,
        status: overrides.status ?? defaults.status,
        updatedAt: new Date(),
      },
    });

    return { id, bikeNumber, chipId };
  };
}

export type BikeFactory = ReturnType<typeof createBikeFactory>;
