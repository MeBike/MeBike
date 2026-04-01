import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  StationRoleAssignmentLimitExceeded,
  TechnicianTeamMemberLimitExceeded,
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
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly findByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly findByStripeConnectedAccountId: (
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>>;
  readonly searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[]>;
  readonly listTechnicianSummaries: () => Effect.Effect<
    readonly Pick<UserRow, "id" | "fullname">[]
  >;
  readonly listAvailableTechnicianTeams: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[]>;
  readonly countTechnicianTeamMembers: (
    technicianTeamId: string,
    options?: { readonly excludeUserId?: string },
  ) => Effect.Effect<number>;
  readonly countStationRoleAssignments: (
    stationId: string,
    role: "STAFF" | "MANAGER",
    options?: { readonly excludeUserId?: string },
  ) => Effect.Effect<number>;
};

export type UserCommandRepo = {
  readonly createRegisteredUser: (data: {
    readonly fullname: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly phoneNumber?: string | null;
  }) => Effect.Effect<
    UserRow,
    DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  readonly createUser: (
    data: CreateUserInput,
  ) => Effect.Effect<
    UserRow,
    DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | StationRoleAssignmentLimitExceeded
    | TechnicianTeamMemberLimitExceeded
  >;
  readonly updateProfile: (
    id: string,
    patch: UpdateUserProfilePatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  readonly updateAdminById: (
    id: string,
    patch: UpdateUserAdminPatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | StationRoleAssignmentLimitExceeded
    | TechnicianTeamMemberLimitExceeded
  >;
  readonly updatePassword: (
    id: string,
    passwordHash: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly setStripeConnectedAccountId: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly setStripeConnectedAccountIdIfNull: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly setStripePayoutsEnabled: (
    id: string,
    enabled: boolean,
  ) => Effect.Effect<Option.Option<UserRow>>;
  readonly setStripePayoutsEnabledByAccountId: (
    accountId: string,
    enabled: boolean,
  ) => Effect.Effect<boolean>;
};

export type UserRepo = UserQueryRepo & UserCommandRepo;
