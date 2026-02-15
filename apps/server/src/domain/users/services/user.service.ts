import bcrypt from "bcrypt";
import { Effect, Layer, Option } from "effect";

import { env } from "@/config/env";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  InvalidCurrentPassword,
  UserRepositoryError,
} from "../domain-errors";
import type {
  CreateUserInput,
  UserFilter,
  UserRow,
  UserSortField,
} from "../models";
import type { UserRepo } from "../repository/user.repository";

import { InvalidCurrentPassword as InvalidCurrentPasswordError } from "../domain-errors";
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
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
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
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
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

function makeUserService(repo: UserRepo): UserService {
  return {
    getById: id =>
      repo.findById(id),

    getByEmail: email =>
      repo.findByEmail(email),

    create: input =>
      repo.createUser(input),

    updateProfile: (id, patch) =>
      repo.updateProfile(id, patch),

    updateAdminById: (id, patch) =>
      repo.updateAdminById(id, patch),

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
