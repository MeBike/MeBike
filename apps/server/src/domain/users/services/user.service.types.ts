import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  InvalidCurrentPassword,
  InvalidOrgAssignment,
  StationRoleAssignmentLimitExceeded,
  TechnicianTeamMemberLimitExceeded,
} from "../domain-errors";
import type {
  CreateUserInput,
  UpdateUserAdminPatch,
  UpdateUserProfilePatch,
  UserFilter,
  UserRow,
  UserSortField,
} from "../models";

export type UserQueryService = {
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  getByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  findByNfcCardUid: (
    nfcCardUid: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  findByStripeConnectedAccountId: (
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>>;
  searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[]>;
  listTechnicianSummaries: () => Effect.Effect<
    readonly Pick<UserRow, "id" | "fullname">[]
  >;
};

export type UserCommandService = {
  create: (input: CreateUserInput) => Effect.Effect<
    UserRow,
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | InvalidOrgAssignment
    | StationRoleAssignmentLimitExceeded
    | TechnicianTeamMemberLimitExceeded
  >;
  updateProfile: (
    id: string,
    patch: UpdateUserProfilePatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  updateAdminById: (
    id: string,
    patch: UpdateUserAdminPatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | InvalidOrgAssignment
    | StationRoleAssignmentLimitExceeded
    | TechnicianTeamMemberLimitExceeded
  >;
  updatePassword: (
    id: string,
    passwordHash: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  changePassword: (args: {
    id: string;
    currentPassword: string;
    newPassword: string;
  }) => Effect.Effect<
    Option.Option<UserRow>,
    InvalidCurrentPassword
  >;
  markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  setStripeConnectedAccountId: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  setStripeConnectedAccountIdIfNull: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  setStripePayoutsEnabled: (
    id: string,
    enabled: boolean,
  ) => Effect.Effect<Option.Option<UserRow>>;
  setStripePayoutsEnabledByAccountId: (
    accountId: string,
    enabled: boolean,
  ) => Effect.Effect<boolean>;
};

export type UserService = UserQueryService & UserCommandService;
