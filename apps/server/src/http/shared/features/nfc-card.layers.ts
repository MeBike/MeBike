import { Layer } from "effect";

import {
  NfcCardCommandRepositoryLive,
  NfcCardCommandServiceLive,
  NfcCardQueryRepositoryLive,
  NfcCardQueryServiceLive,
} from "@/domain/nfc-cards";

import { PrismaLive } from "../infra.layers";
import { UserQueryReposLive } from "./user.layers";

export const NfcCardQueryReposLive = NfcCardQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const NfcCardCommandReposLive = NfcCardCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const NfcCardQueryServiceLayer = NfcCardQueryServiceLive.pipe(
  Layer.provide(NfcCardQueryReposLive),
);

export const NfcCardCommandServiceLayer = NfcCardCommandServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
  Layer.provide(NfcCardQueryReposLive),
  Layer.provide(NfcCardCommandReposLive),
);

export const NfcCardDepsLive = Layer.mergeAll(
  NfcCardQueryReposLive,
  NfcCardCommandReposLive,
  NfcCardQueryServiceLayer,
  NfcCardCommandServiceLayer,
  PrismaLive,
  UserQueryReposLive,
);
