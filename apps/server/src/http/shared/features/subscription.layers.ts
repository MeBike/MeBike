import { Layer } from "effect";

import {
  SubscriptionRepositoryLive,
  SubscriptionServiceLive,
} from "@/domain/subscriptions";

import { EmailLive, PrismaLive } from "../infra.layers";
import { UserDepsLive } from "./user.layers";
import { WalletDepsLive } from "./wallet.layers";

export const SubscriptionReposLive = SubscriptionRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const SubscriptionServiceLayer = SubscriptionServiceLive.pipe(
  Layer.provide(SubscriptionReposLive),
);

export const SubscriptionDepsLive = Layer.mergeAll(
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  WalletDepsLive,
  UserDepsLive,
  EmailLive,
  PrismaLive,
);
