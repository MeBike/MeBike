import { Effect } from "effect";

import type {
  InvalidOrgAssignment,
  TechnicianTeamMemberLimitExceeded,
} from "../domain-errors";
import type { UserOrgAssignmentPatch, UserRow } from "../models";
import type { UserRepo } from "../repository/user.repository";

import {
  InvalidOrgAssignment as InvalidOrgAssignmentError,
  TechnicianTeamMemberLimitExceeded as TechnicianTeamMemberLimitExceededError,
} from "../domain-errors";

export function normalizeOrgAssignment(
  assignment: UserOrgAssignmentPatch | null | undefined,
): UserOrgAssignmentPatch | null | undefined {
  if (assignment === undefined) {
    return undefined;
  }

  if (assignment === null) {
    return null;
  }

  const normalized: UserOrgAssignmentPatch = {
    stationId: assignment.stationId ?? undefined,
    agencyId: assignment.agencyId ?? undefined,
    technicianTeamId: assignment.technicianTeamId ?? undefined,
  };

  if (!normalized.stationId && !normalized.agencyId && !normalized.technicianTeamId) {
    return null;
  }

  return normalized;
}

export function toOrgAssignmentPatch(
  orgAssignment: UserRow["orgAssignment"],
): UserOrgAssignmentPatch | null {
  if (!orgAssignment) {
    return null;
  }

  return normalizeOrgAssignment({
    stationId: orgAssignment.station?.id,
    agencyId: orgAssignment.agency?.id,
    technicianTeamId: orgAssignment.technicianTeam?.id,
  }) ?? null;
}

export function validateOrgAssignmentForRole(
  role: UserRow["role"],
  assignment: UserOrgAssignmentPatch | null,
): Effect.Effect<void, InvalidOrgAssignment> {
  const stationId = assignment?.stationId ?? null;
  const agencyId = assignment?.agencyId ?? null;
  const technicianTeamId = assignment?.technicianTeamId ?? null;

  const hasStation = stationId !== null;
  const hasAgency = agencyId !== null;
  const hasTechnicianTeam = technicianTeamId !== null;

  const fail = () =>
    Effect.fail(new InvalidOrgAssignmentError({
      role,
      stationId,
      agencyId,
      technicianTeamId,
    }));

  switch (role) {
    case "USER":
    case "ADMIN":
    case "MANAGER":
      return hasStation || hasAgency || hasTechnicianTeam ? fail() : Effect.void;
    case "STAFF":
      return hasStation && !hasAgency && !hasTechnicianTeam ? Effect.void : fail();
    case "AGENCY":
      return !hasStation && hasAgency && !hasTechnicianTeam ? Effect.void : fail();
    case "TECHNICIAN":
      return !hasStation && !hasAgency && hasTechnicianTeam ? Effect.void : fail();
    default:
      return fail();
  }
}

export function makeValidateTechnicianTeamCapacity(repo: UserRepo) {
  const technicianTeamMemberLimit = 3;

  return (args: {
    technicianTeamId: string | null;
    excludeUserId?: string;
  }): Effect.Effect<void, TechnicianTeamMemberLimitExceeded | import("../domain-errors").UserRepositoryError> =>
    Effect.gen(function* () {
      if (!args.technicianTeamId) {
        return;
      }

      const memberCount = yield* repo.countTechnicianTeamMembers(args.technicianTeamId, {
        excludeUserId: args.excludeUserId,
      });

      if (memberCount >= technicianTeamMemberLimit) {
        return yield* Effect.fail(new TechnicianTeamMemberLimitExceededError({
          technicianTeamId: args.technicianTeamId,
          memberLimit: technicianTeamMemberLimit,
        }));
      }
    });
}
