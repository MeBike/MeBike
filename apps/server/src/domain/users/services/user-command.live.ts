import { Effect, Layer } from "effect";

import { AgencyRepository } from "@/domain/agencies";
import { StationRepository } from "@/domain/stations";
import { TechnicianTeamQueryRepository } from "@/domain/technician-teams";

import {
  UserCommandRepository,
} from "../repository/user-command.repository";
import { UserQueryRepository } from "../repository/user-query.repository";
import { makeUserCommandService } from "./user-command.service";

export type { UserCommandService } from "./user.service.types";

const makeUserCommandServiceEffect = Effect.gen(function* () {
  const agencyRepo = yield* AgencyRepository;
  const queryRepo = yield* UserQueryRepository;
  const commandRepo = yield* UserCommandRepository;
  const stationRepo = yield* StationRepository;
  const technicianTeamQueryRepo = yield* TechnicianTeamQueryRepository;

  return makeUserCommandService({
    agencyRepo,
    commandRepo,
    queryRepo,
    stationRepo,
    technicianTeamQueryRepo,
  });
});

export class UserCommandServiceTag extends Effect.Service<UserCommandServiceTag>()(
  "UserCommandService",
  {
    effect: makeUserCommandServiceEffect,
  },
) {}

export const UserCommandServiceLive = Layer.effect(
  UserCommandServiceTag,
  makeUserCommandServiceEffect.pipe(Effect.map(UserCommandServiceTag.make)),
);
