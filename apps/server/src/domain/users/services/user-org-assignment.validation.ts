import { Effect, Option } from "effect";

import type { AgencyRepo } from "@/domain/agencies";
import type { StationRepo } from "@/domain/stations";
import type { TechnicianTeamQueryRepo } from "@/domain/technician-teams";

import { AgencyRepositoryError } from "@/domain/agencies/domain-errors";
import { defectOn } from "@/domain/shared";
import { TECHNICIAN_TEAM_MEMBER_LIMIT } from "@/domain/technician-teams";

import type {
  InvalidOrgAssignment,
  StationRoleAssignmentLimitExceeded,
  TechnicianTeamMemberLimitExceeded,
} from "../domain-errors";
import type { UserRow } from "../models";
import type { UserQueryRepo } from "../repository/user-query.repository";

import {
  InvalidOrgAssignment as InvalidOrgAssignmentError,
  StationRoleAssignmentLimitExceeded as StationRoleAssignmentLimitExceededError,
  TechnicianTeamMemberLimitExceeded as TechnicianTeamMemberLimitExceededError,
} from "../domain-errors";

export function makeValidateOrgAssignmentTargetsExist(deps: {
  agencyRepo: Pick<AgencyRepo, "getById">;
  stationRepo: Pick<StationRepo, "getById">;
  technicianTeamQueryRepo: Pick<TechnicianTeamQueryRepo, "getById">;
}) {
  return (args: {
    stationId: string | null;
    technicianTeamId: string | null;
    role: UserRow["role"];
    agencyId?: string | null;
  }): Effect.Effect<void, InvalidOrgAssignment> =>
    Effect.gen(function* () {
      if (args.stationId) {
        const station = yield* deps.stationRepo.getById(args.stationId);
        if (Option.isNone(station)) {
          return yield* Effect.fail(new InvalidOrgAssignmentError({
            role: args.role,
            stationId: args.stationId,
            agencyId: args.agencyId ?? null,
            technicianTeamId: args.technicianTeamId,
          }));
        }
      }

      if (args.agencyId) {
        const agency = yield* deps.agencyRepo.getById(args.agencyId).pipe(
          defectOn(AgencyRepositoryError),
        );
        if (Option.isNone(agency)) {
          return yield* Effect.fail(new InvalidOrgAssignmentError({
            role: args.role,
            stationId: args.stationId,
            agencyId: args.agencyId,
            technicianTeamId: args.technicianTeamId,
          }));
        }
      }

      if (args.technicianTeamId) {
        const technicianTeam = yield* deps.technicianTeamQueryRepo.getById(args.technicianTeamId);
        if (Option.isNone(technicianTeam)) {
          return yield* Effect.fail(new InvalidOrgAssignmentError({
            role: args.role,
            stationId: args.stationId,
            agencyId: args.agencyId ?? null,
            technicianTeamId: args.technicianTeamId,
          }));
        }
      }
    });
}

export function makeValidateTechnicianTeamCapacity(
  repo: Pick<TechnicianTeamQueryRepo, "countMembers">,
) {
  return (args: {
    technicianTeamId: string | null;
    excludeUserId?: string;
  }): Effect.Effect<void, TechnicianTeamMemberLimitExceeded> =>
    Effect.gen(function* () {
      if (!args.technicianTeamId) {
        return;
      }

      const memberCount = yield* repo.countMembers(args.technicianTeamId, {
        excludeUserId: args.excludeUserId,
      });

      if (memberCount >= TECHNICIAN_TEAM_MEMBER_LIMIT) {
        return yield* Effect.fail(new TechnicianTeamMemberLimitExceededError({
          technicianTeamId: args.technicianTeamId,
          memberLimit: TECHNICIAN_TEAM_MEMBER_LIMIT,
        }));
      }
    });
}

export function makeValidateStationRoleAssignmentLimit(
  repo: Pick<UserQueryRepo, "countStationRoleAssignments">,
) {
  const stationRoleAssignmentLimit = 1;

  return (args: {
    stationId: string | null;
    role: UserRow["role"];
    excludeUserId?: string;
  }): Effect.Effect<void, StationRoleAssignmentLimitExceeded> =>
    Effect.gen(function* () {
      if (!args.stationId || (args.role !== "STAFF" && args.role !== "MANAGER")) {
        return;
      }

      const assignmentCount = yield* repo.countStationRoleAssignments(args.stationId, args.role, {
        excludeUserId: args.excludeUserId,
      });

      if (assignmentCount >= stationRoleAssignmentLimit) {
        return yield* Effect.fail(new StationRoleAssignmentLimitExceededError({
          stationId: args.stationId,
          role: args.role,
          assignmentLimit: stationRoleAssignmentLimit,
        }));
      }
    });
}
