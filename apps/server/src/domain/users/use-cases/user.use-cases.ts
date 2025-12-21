import type { Option } from "effect";

import { Effect } from "effect";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type { UserFilter, UserRow, UserSortField } from "../models";

import { hashPassword } from "../../auth/services/auth.service";
import { UserServiceTag } from "../services/user.service";

export function getUserByIdUseCase(id: string): Effect.Effect<Option.Option<UserRow>, import("../domain-errors").UserRepositoryError, UserServiceTag> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.getById(id);
  });
}

export function getUserByEmailUseCase(email: string): Effect.Effect<Option.Option<UserRow>, import("../domain-errors").UserRepositoryError, UserServiceTag> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.getByEmail(email);
  });
}

export function updateProfileUseCase(args: {
  userId: string;
  patch: Parameters<import("../repository/user.repository").UserRepo["updateProfile"]>[1];
}): Effect.Effect<
  Option.Option<UserRow>,
  import("../domain-errors").UserRepositoryError
    | import("../domain-errors").DuplicateUserEmail
    | import("../domain-errors").DuplicateUserPhoneNumber,
  UserServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.updateProfile(args.userId, args.patch);
  });
}

export function listAdminUsersUseCase(args: {
  filter: UserFilter;
  page: PageRequest<UserSortField>;
}): Effect.Effect<PageResult<UserRow>, import("../domain-errors").UserRepositoryError, UserServiceTag> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.listWithOffset(args.filter, args.page);
  });
}

export function searchAdminUsersUseCase(query: string): Effect.Effect<
  readonly UserRow[],
  import("../domain-errors").UserRepositoryError,
  UserServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.searchByQuery(query);
  });
}

export function updateAdminUserUseCase(args: {
  userId: string;
  patch: Parameters<import("../repository/user.repository").UserRepo["updateAdminById"]>[1];
}): Effect.Effect<
  Option.Option<UserRow>,
  import("../domain-errors").UserRepositoryError
    | import("../domain-errors").DuplicateUserEmail
    | import("../domain-errors").DuplicateUserPhoneNumber,
  UserServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.updateAdminById(args.userId, args.patch);
  });
}

export function adminCreateUserUseCase(args: {
  fullname: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  username?: string | null;
  avatar?: string | null;
  location?: string | null;
  role?: import("../models").UserRow["role"];
  verify?: import("../models").UserRow["verify"];
  nfcCardUid?: string | null;
}): Effect.Effect<
  UserRow,
  import("../domain-errors").UserRepositoryError
    | import("../domain-errors").DuplicateUserEmail
    | import("../domain-errors").DuplicateUserPhoneNumber,
  UserServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    const passwordHash = yield* hashPassword(args.password);
    return yield* service.create({
      fullname: args.fullname,
      email: args.email,
      passwordHash,
      phoneNumber: args.phoneNumber,
      username: args.username,
      avatar: args.avatar,
      location: args.location,
      role: args.role,
      verify: args.verify,
      nfcCardUid: args.nfcCardUid,
    });
  });
}

export function adminResetPasswordUseCase(args: {
  userId: string;
  newPassword: string;
}): Effect.Effect<
  Option.Option<UserRow>,
  import("../domain-errors").UserRepositoryError,
  UserServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    const passwordHash = yield* hashPassword(args.newPassword);
    return yield* service.updatePassword(args.userId, passwordHash);
  });
}
