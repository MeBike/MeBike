import { uuidv7 } from "uuidv7";

import type { CreatedUserOrgAssignment, FactoryContext, UserOrgAssignmentOverrides } from "./types";

export function createUserOrgAssignmentFactory(ctx: FactoryContext) {
  return async (overrides: UserOrgAssignmentOverrides): Promise<CreatedUserOrgAssignment> => {
    const id = overrides.id ?? uuidv7();

    if (!overrides.userId) {
      throw new Error("userId is required for createUserOrgAssignment");
    }

    await ctx.prisma.userOrgAssignment.create({
      data: {
        id,
        userId: overrides.userId,
        stationId: overrides.stationId ?? null,
        agencyId: overrides.agencyId ?? null,
        technicianTeamId: overrides.technicianTeamId ?? null,
      },
    });

    return { id, userId: overrides.userId };
  };
}

export type UserOrgAssignmentFactory = ReturnType<typeof createUserOrgAssignmentFactory>;
