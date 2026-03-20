import { uuidv7 } from "uuidv7";

import type { CreatedTechnicianTeam, FactoryContext, TechnicianTeamOverrides } from "./types";

const defaults = {
  availabilityStatus: "AVAILABLE" as const,
};

export function createTechnicianTeamFactory(ctx: FactoryContext) {
  let counter = 0;

  return async (overrides: TechnicianTeamOverrides): Promise<CreatedTechnicianTeam> => {
    counter++;
    const id = overrides.id ?? uuidv7();

    if (!overrides.stationId) {
      throw new Error("stationId is required for createTechnicianTeam");
    }

    await ctx.prisma.technicianTeam.create({
      data: {
        id,
        name: overrides.name ?? `Technician Team ${counter}`,
        stationId: overrides.stationId,
        availabilityStatus: overrides.availabilityStatus ?? defaults.availabilityStatus,
      },
    });

    return { id, stationId: overrides.stationId };
  };
}

export type TechnicianTeamFactory = ReturnType<typeof createTechnicianTeamFactory>;
