import bcrypt from "bcrypt";
import { Effect, Layer, Option } from "effect";

import { env } from "@/config/env";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  InvalidCurrentPassword,
  InvalidOrgAssignment,
  UserRepositoryError,
} from "../domain-errors";
import type {
  CreateUserInput,
  UpdateUserAdminPatch,
  UserFilter,
  UserOrgAssignmentPatch,
  UserRow,
  UserSortField,
} from "../models";
import type { UserRepo } from "../repository/user.repository";

import {
  InvalidCurrentPassword as InvalidCurrentPasswordError,
  InvalidOrgAssignment as InvalidOrgAssignmentError,
} from "../domain-errors";
import { UserRepository } from "../repository/user.repository";

export type UserService = {
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  getByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  create: (input: CreateUserInput) => Effect.Effect<
    UserRow,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber | InvalidOrgAssignment
  >;
  updateProfile: (
    id: string,
    patch: Parameters<UserRepo["updateProfile"]>[1],
  ) => Effect.Effect<
    Option.Option<UserRow>,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  updateAdminById: (
    id: string,
    patch: Parameters<UserRepo["updateAdminById"]>[1],
  ) => Effect.Effect<
    Option.Option<UserRow>,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber | InvalidOrgAssignment
  >;
  updatePassword: (
    id: string,
    passwordHash: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  changePassword: (args: {
    id: string;
    currentPassword: string;
    newPassword: string;
  }) => Effect.Effect<
    Option.Option<UserRow>,
    UserRepositoryError | InvalidCurrentPassword
  >;
  markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  findByStripeConnectedAccountId: (
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  setStripeConnectedAccountId: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  setStripeConnectedAccountIdIfNull: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  setStripePayoutsEnabled: (
    id: string,
    enabled: boolean,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  setStripePayoutsEnabledByAccountId: (
    accountId: string,
    enabled: boolean,
  ) => Effect.Effect<boolean, UserRepositoryError>;
  listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>, UserRepositoryError>;
  searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[], UserRepositoryError>;
};

function normalizeOrgAssignment(
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

function toOrgAssignmentPatch(
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

function validateOrgAssignmentForRole(
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

function makeUserService(repo: UserRepo): UserService {
  return {
    getById: id =>
      repo.findById(id),

    getByEmail: email =>
      repo.findByEmail(email),

    create: input =>
      Effect.gen(function* () {
        const role = input.role ?? "USER";
        const orgAssignment = normalizeOrgAssignment(input.orgAssignment) ?? null;

        yield* validateOrgAssignmentForRole(role, orgAssignment);

        return yield* repo.createUser({
          ...input,
          role,
          orgAssignment,
        });
      }),

    updateProfile: (id, patch) =>
      repo.updateProfile(id, patch),

    updateAdminById: (id, patch) =>
      Effect.gen(function* () {
        // NOTE: This does a read-before-write to validate the merged next state,
        // so there is a small TOCTOU window until the repo update runs.
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

        const nextPatch: UpdateUserAdminPatch = {
          ...patch,
          ...(patch.orgAssignment === undefined ? {} : { orgAssignment: nextOrgAssignment }),
        };

        return yield* repo.updateAdminById(id, nextPatch);
      }),

    updatePassword: (id, passwordHash) =>
      repo.updatePassword(id, passwordHash),

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

    markVerified: id =>
      repo.markVerified(id),

    findByStripeConnectedAccountId: accountId =>
      repo.findByStripeConnectedAccountId(accountId),

    setStripeConnectedAccountId: (id, accountId) =>
      repo.setStripeConnectedAccountId(id, accountId),

    setStripeConnectedAccountIdIfNull: (id, accountId) =>
      repo.setStripeConnectedAccountIdIfNull(id, accountId),

    setStripePayoutsEnabled: (id, enabled) =>
      repo.setStripePayoutsEnabled(id, enabled),

    setStripePayoutsEnabledByAccountId: (accountId, enabled) =>
      repo.setStripePayoutsEnabledByAccountId(accountId, enabled),

    listWithOffset: (filter, pageReq) =>
      repo.listWithOffset(filter, pageReq),

    searchByQuery: query =>
      repo.searchByQuery(query),
  };
}

const makeUserServiceEffect = Effect.gen(function* () {
  const repo = yield* UserRepository;
  return makeUserService(repo);
});

export class UserServiceTag extends Effect.Service<UserServiceTag>()(
  "UserService",
  {
    effect: makeUserServiceEffect,
  },
) {}

export const UserServiceLive = Layer.effect(
  UserServiceTag,
  makeUserServiceEffect.pipe(Effect.map(UserServiceTag.make)),
);
