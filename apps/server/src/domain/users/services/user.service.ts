import { Context, Effect, Layer, Option } from "effect";

import type { UserRow } from "../models";
import type { UserRepo } from "../repository/user.repository";
import { UserRepository } from "../repository/user.repository";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  UserRepositoryError,
} from "../domain-errors";

export type UserService = {
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  getByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  create: (input: {
    fullname: string;
    email: string;
    passwordHash: string;
    phoneNumber?: string | null;
    username?: string | null;
    avatar?: string | null;
    location?: string | null;
  }) => Effect.Effect<
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
  updatePassword: (
    id: string,
    passwordHash: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
};

export class UserServiceTag extends Context.Tag("UserService")<
  UserServiceTag,
  UserService
>() {}

export const UserServiceLive = Layer.effect(
  UserServiceTag,
  Effect.gen(function* () {
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

      updatePassword: (id, passwordHash) =>
        repo.updatePassword(id, passwordHash),

      markVerified: id =>
        repo.markVerified(id),
    };

    return service;
  }),
);
