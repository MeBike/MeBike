import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  InvalidCurrentPassword,
  InvalidOrgAssignment,
  TechnicianTeamMemberLimitExceeded,
  UserRepositoryError,
} from "../domain-errors";
import type {
  CreateUserInput,
  UserFilter,
  UserRow,
  UserSortField,
} from "../models";
import type { UserRepo } from "../repository/user.repository";

export type UserService = {
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  getByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  create: (input: CreateUserInput) => Effect.Effect<
    UserRow,
    | UserRepositoryError
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | InvalidOrgAssignment
    | TechnicianTeamMemberLimitExceeded
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
    | UserRepositoryError
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | InvalidOrgAssignment
    | TechnicianTeamMemberLimitExceeded
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
  listTechnicianSummaries: () => Effect.Effect<
    readonly Pick<UserRow, "id" | "fullname">[],
    UserRepositoryError
  >;
};
