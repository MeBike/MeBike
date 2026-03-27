import bcrypt from "bcrypt";
import { Effect, Option } from "effect";

import { env } from "@/config/env";

import type { UpdateUserAdminPatch, UserRow } from "../../models";
import type { UserRepo } from "../../repository/user.repository";
import type { UserService } from "../user.service.types";

import { InvalidCurrentPassword as InvalidCurrentPasswordError } from "../../domain-errors";
import {
  makeValidateTechnicianTeamCapacity,
  normalizeOrgAssignment,
  toOrgAssignmentPatch,
  validateOrgAssignmentForRole,
} from "../user.policies";

export type UserCommandService = Pick<
  UserService,
  | "create"
  | "updateProfile"
  | "updateAdminById"
  | "updatePassword"
  | "changePassword"
  | "markVerified"
  | "setStripeConnectedAccountId"
  | "setStripeConnectedAccountIdIfNull"
  | "setStripePayoutsEnabled"
  | "setStripePayoutsEnabledByAccountId"
>;

export function makeUserCommandService(repo: UserRepo): UserCommandService {
  const validateTechnicianTeamCapacity = makeValidateTechnicianTeamCapacity(repo);

  return {
    create: input =>
      Effect.gen(function* () {
        const role = input.role ?? "USER";
        const orgAssignment = normalizeOrgAssignment(input.orgAssignment) ?? null;

        yield* validateOrgAssignmentForRole(role, orgAssignment);
        yield* validateTechnicianTeamCapacity({
          technicianTeamId: orgAssignment?.technicianTeamId ?? null,
        });

        return yield* repo.createUser({
          ...input,
          role,
          orgAssignment,
        });
      }),

    updateProfile: (id, patch) => repo.updateProfile(id, patch),

    updateAdminById: (id, patch) =>
      Effect.gen(function* () {
        const existingOpt = yield* repo.findById(id);
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

        return yield* repo.updateAdminById(id, nextPatch);
      }),

    updatePassword: (id, passwordHash) => repo.updatePassword(id, passwordHash),

    changePassword: ({ id, currentPassword, newPassword }) =>
      Effect.gen(function* () {
        const userOpt = yield* repo.findById(id);
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

        return yield* repo.updatePassword(id, nextPasswordHash);
      }),

    markVerified: id => repo.markVerified(id),
    setStripeConnectedAccountId: (id, accountId) => repo.setStripeConnectedAccountId(id, accountId),
    setStripeConnectedAccountIdIfNull: (id, accountId) => repo.setStripeConnectedAccountIdIfNull(id, accountId),
    setStripePayoutsEnabled: (id, enabled) => repo.setStripePayoutsEnabled(id, enabled),
    setStripePayoutsEnabledByAccountId: (accountId, enabled) =>
      repo.setStripePayoutsEnabledByAccountId(accountId, enabled),
  };
}
