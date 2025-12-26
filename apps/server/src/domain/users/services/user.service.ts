import type { Option } from "effect";

import { Effect } from "effect";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  UserRepositoryError,
} from "../domain-errors";
import type {
  CreateUserInput,
  UserFilter,
  UserRow,
  UserSortField,
} from "../models";
import type { UserRepo } from "../repository/user.repository";

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
  markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>, UserRepositoryError>;
  searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[], UserRepositoryError>;
};

export class UserServiceTag extends Effect.Service<UserServiceTag>()(
  "UserService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* UserRepository;

      const service: UserService = {
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

        markVerified: id =>
          repo.markVerified(id),

        listWithOffset: (filter, pageReq) =>
          repo.listWithOffset(filter, pageReq),

        searchByQuery: query =>
          repo.searchByQuery(query),
      };

      return service;
    }),
    dependencies: [UserRepository.Default],
  },
) {}

export const UserServiceLive = UserServiceTag.Default;
