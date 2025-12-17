import type { Option } from "effect";

import { Effect } from "effect";

import type { UserRow } from "../models";

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
