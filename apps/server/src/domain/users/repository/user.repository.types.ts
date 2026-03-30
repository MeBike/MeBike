import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  StationRoleAssignmentLimitExceeded,
  TechnicianTeamMemberLimitExceeded,
  UserRepositoryError,
} from "../domain-errors";
import type {
  CreateUserInput,
  TechnicianTeamAvailableOption,
  UpdateUserAdminPatch,
  UpdateUserProfilePatch,
  UserFilter,
  UserRow,
  UserSortField,
} from "../models";

export type UserQueryRepo = {
  readonly findById: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly findByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly findByStripeConnectedAccountId: (
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>, UserRepositoryError>;
  readonly searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[], UserRepositoryError>;
  readonly listTechnicianSummaries: () => Effect.Effect<
    readonly Pick<UserRow, "id" | "fullname">[],
    UserRepositoryError
  >;
  readonly listAvailableTechnicianTeams: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[], UserRepositoryError>;
  readonly countTechnicianTeamMembers: (
    technicianTeamId: string,
    options?: { readonly excludeUserId?: string },
  ) => Effect.Effect<number, UserRepositoryError>;
  readonly countStationRoleAssignments: (
    stationId: string,
    role: "STAFF" | "MANAGER",
    options?: { readonly excludeUserId?: string },
  ) => Effect.Effect<number, UserRepositoryError>;
};

export type UserCommandRepo = {
  readonly createRegisteredUser: (data: {
    readonly fullname: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly phoneNumber?: string | null;
  }) => Effect.Effect<
    UserRow,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  readonly createUser: (
    data: CreateUserInput,
  ) => Effect.Effect<
    UserRow,
    UserRepositoryError
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | StationRoleAssignmentLimitExceeded
    | TechnicianTeamMemberLimitExceeded
  >;
  readonly updateProfile: (
    id: string,
    patch: UpdateUserProfilePatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  readonly updateAdminById: (
    id: string,
    patch: UpdateUserAdminPatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    UserRepositoryError
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | StationRoleAssignmentLimitExceeded
    | TechnicianTeamMemberLimitExceeded
  >;
  readonly updatePassword: (
    id: string,
    passwordHash: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripeConnectedAccountId: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripeConnectedAccountIdIfNull: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripePayoutsEnabled: (
    id: string,
    enabled: boolean,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripePayoutsEnabledByAccountId: (
    accountId: string,
    enabled: boolean,
  ) => Effect.Effect<boolean, UserRepositoryError>;
};

export type UserRepo = UserQueryRepo & UserCommandRepo;
