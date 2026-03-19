import { uuidv7 } from "uuidv7";

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
    const chipId = overrides.chipId ?? `CHIP-${counter}-${id.slice(0, 8)}`;

    await ctx.prisma.bike.create({
      data: {
        id,
        chipId,
        stationId: overrides.stationId ?? defaults.stationId,
        supplierId: overrides.supplierId ?? defaults.supplierId,
        status: overrides.status ?? defaults.status,
        updatedAt: new Date(),
      },
    });

    return { id, chipId };
  };
}

export type BikeFactory = ReturnType<typeof createBikeFactory>;
