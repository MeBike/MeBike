import { Effect, Layer } from "effect";

import type { UserRepo } from "../repository/user.repository";

import { UserRepository } from "../repository/user.repository";
import { makeUserCommandService } from "./commands/user.command.service";
import { makeUserQueryService } from "./queries/user.query.service";

export type { UserService } from "./user.service.types";

function makeUserService(repo: UserRepo): import("./user.service.types").UserService {
  return {
    ...makeUserQueryService(repo),
    ...makeUserCommandService({
      commandRepo: repo,
      queryRepo: repo,
    }),
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
