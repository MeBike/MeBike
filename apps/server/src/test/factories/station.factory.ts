import { uuidv7 } from "uuidv7";

import type { CreatedStation, FactoryContext, StationOverrides } from "./types";

const defaults = {
  address: "123 Test Street",
  stationType: "INTERNAL" as const,
  capacity: 10,
  returnSlotLimit: 10,
  latitude: 10.762622,
  longitude: 106.660172,
};

export function createStationFactory(ctx: FactoryContext) {
  let counter = 0;

  return async (overrides: StationOverrides = {}): Promise<CreatedStation> => {
    counter++;
    const id = overrides.id ?? uuidv7();
    const name = overrides.name ?? `Station ${counter}`;

    await ctx.prisma.$executeRaw`
      INSERT INTO "Station" (id, name, address, station_type, agency_id, total_capacity, return_slot_limit, latitude, longitude, created_at, updated_at, position)
      VALUES (
        ${id}::uuid,
        ${name},
        ${overrides.address ?? defaults.address},
        ${(overrides.stationType ?? defaults.stationType)}::"station_type",
        ${overrides.agencyId ?? null}::uuid,
        ${overrides.capacity ?? defaults.capacity},
        ${overrides.returnSlotLimit ?? overrides.capacity ?? defaults.returnSlotLimit},
        ${overrides.latitude ?? defaults.latitude},
        ${overrides.longitude ?? defaults.longitude},
        NOW(),
        NOW(),
        ST_SetSRID(ST_MakePoint(${overrides.longitude ?? defaults.longitude}, ${overrides.latitude ?? defaults.latitude}), 4326)::geography
      )
    `;

    return { id, name };
  };
}

export type StationFactory = ReturnType<typeof createStationFactory>;
