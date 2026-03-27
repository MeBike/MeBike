import bcrypt from "bcrypt";
import { Effect, Option } from "effect";

import { env } from "@/config/env";

import type { UpdateUserAdminPatch, UserRow } from "../../models";
import type { UserCommandRepo } from "../../repository/user-command.repository";
import type { UserQueryRepo } from "../../repository/user-query.repository";
import type { UserCommandService } from "../user.service.types";

import { InvalidCurrentPassword as InvalidCurrentPasswordError } from "../../domain-errors";
import {
  makeValidateTechnicianTeamCapacity,
  normalizeOrgAssignment,
  toOrgAssignmentPatch,
  validateOrgAssignmentForRole,
} from "../user.policies";

export function makeUserCommandService(args: {
  commandRepo: UserCommandRepo;
  queryRepo: UserQueryRepo;
}): UserCommandService {
  const { commandRepo, queryRepo } = args;
  const validateTechnicianTeamCapacity = makeValidateTechnicianTeamCapacity(queryRepo);

  return {
    create: input =>
      Effect.gen(function* () {
        const role = input.role ?? "USER";
        const orgAssignment = normalizeOrgAssignment(input.orgAssignment) ?? null;

        yield* validateOrgAssignmentForRole(role, orgAssignment);
        yield* validateTechnicianTeamCapacity({
          technicianTeamId: orgAssignment?.technicianTeamId ?? null,
        });

        return yield* commandRepo.createUser({
          ...input,
          role,
          orgAssignment,
        });
      }),

    updateProfile: (id, patch) => commandRepo.updateProfile(id, patch),

    updateAdminById: (id, patch) =>
      Effect.gen(function* () {
        const existingOpt = yield* queryRepo.findById(id);
        if (Option.isNone(existingOpt)) {
          return Option.none<UserRow>();
        }

        const existing = existingOpt.value;
        const nextRole = patch.role ?? existing.role;
        const nextOrgAssignment = patch.orgAssignment === undefined
          ? toOrgAssignmentPatch(existing.orgAssignment)
          : (normalizeOrgAssignment(patch.orgAssignment) ?? null);

        yield* validateOrgAssignmentForRole(nextRole, nextOrgAssignment);
        yield* validateTechnicianTeamCapacity({
          technicianTeamId: nextOrgAssignment?.technicianTeamId ?? null,
          excludeUserId: id,
        });

        const nextPatch: UpdateUserAdminPatch = {
          ...patch,
          ...(patch.orgAssignment === undefined ? {} : { orgAssignment: nextOrgAssignment }),
        };

        return yield* commandRepo.updateAdminById(id, nextPatch);
      }),

    updatePassword: (id, passwordHash) => commandRepo.updatePassword(id, passwordHash),

    changePassword: ({ id, currentPassword, newPassword }) =>
      Effect.gen(function* () {
        const userOpt = yield* queryRepo.findById(id);
        if (Option.isNone(userOpt)) {
          return userOpt;
        }

        const user = userOpt.value;
        const isPasswordValid = yield* Effect.promise(() =>
          bcrypt.compare(currentPassword, user.passwordHash),
        );

        if (!isPasswordValid) {
          return yield* Effect.fail(new InvalidCurrentPasswordError({ userId: id }));
        }

        const nextPasswordHash = yield* Effect.promise(() =>
          bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS),
        );

        return yield* commandRepo.updatePassword(id, nextPasswordHash);
      }),

    markVerified: id => commandRepo.markVerified(id),
    setStripeConnectedAccountId: (id, accountId) => commandRepo.setStripeConnectedAccountId(id, accountId),
    setStripeConnectedAccountIdIfNull: (id, accountId) => commandRepo.setStripeConnectedAccountIdIfNull(id, accountId),
    setStripePayoutsEnabled: (id, enabled) => commandRepo.setStripePayoutsEnabled(id, enabled),
    setStripePayoutsEnabledByAccountId: (accountId, enabled) =>
      commandRepo.setStripePayoutsEnabledByAccountId(accountId, enabled),
  };
}
