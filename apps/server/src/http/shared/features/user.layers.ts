import { Layer } from "effect";

import { StationRepositoryLive } from "@/domain/stations";
import {
  AvatarUploadServiceLive,
  UserCommandRepositoryLive,
  UserCommandServiceLive,
  UserQueryRepositoryLive,
  UserQueryServiceLive,
  UserStatsRepositoryLive,
  UserStatsServiceLive,
} from "@/domain/users";
import { FirebaseStorageLive } from "@/infrastructure/firebase";

import { PrismaLive } from "../infra.layers";
import { TechnicianTeamQueryReposLive } from "./technician-team.layers";

export const UserQueryReposLive = UserQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const UserCommandReposLive = UserCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const UserQueryServiceLayer = UserQueryServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
);

export const UserCommandServiceLayer = UserCommandServiceLive.pipe(
  Layer.provide(StationRepositoryLive.pipe(Layer.provide(PrismaLive))),
  Layer.provide(TechnicianTeamQueryReposLive),
  Layer.provide(UserQueryReposLive),
  Layer.provide(UserCommandReposLive),
);

export const AvatarUploadServiceLayer = AvatarUploadServiceLive.pipe(
  Layer.provide(UserQueryServiceLayer),
  Layer.provide(UserCommandServiceLayer),
);

export const UserDepsLive = Layer.mergeAll(
  TechnicianTeamQueryReposLive,
  UserQueryReposLive,
  UserCommandReposLive,
  UserQueryServiceLayer,
  UserCommandServiceLayer,
  AvatarUploadServiceLayer,
  FirebaseStorageLive,
  PrismaLive,
);

export const UserStatsServiceLayer = UserStatsServiceLive.pipe(
  Layer.provide(UserStatsRepositoryLive),
);

export const UserStatsDepsLive = Layer.mergeAll(
  UserStatsRepositoryLive,
  UserStatsServiceLayer,
);
