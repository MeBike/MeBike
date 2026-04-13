import { Effect } from "effect";

import type { InvalidOrgAssignment } from "../domain-errors";
import type { UserOrgAssignmentPatch, UserRow } from "../models";

import {
  InvalidOrgAssignment as InvalidOrgAssignmentError,
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
      return hasStation || hasAgency || hasTechnicianTeam ? fail() : Effect.void;
    case "MANAGER":
      return hasStation && !hasAgency && !hasTechnicianTeam ? Effect.void : fail();
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
