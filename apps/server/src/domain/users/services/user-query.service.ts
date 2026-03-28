import { Effect, Layer } from "effect";

import { UserQueryRepository } from "../repository/user-query.repository";
import { makeUserQueryService } from "./queries/user.query.service";

export type { UserQueryService } from "./user.service.types";

const makeUserQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* UserQueryRepository;
  return makeUserQueryService(repo);
});

export class UserQueryServiceTag extends Effect.Service<UserQueryServiceTag>()(
  "UserQueryService",
  {
    effect: makeUserQueryServiceEffect,
  },
) {}

export const UserQueryServiceLive = Layer.effect(
  UserQueryServiceTag,
  makeUserQueryServiceEffect.pipe(Effect.map(UserQueryServiceTag.make)),
);
