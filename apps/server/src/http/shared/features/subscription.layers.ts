import { Layer } from "effect";

import {
  SubscriptionCommandRepositoryLive,
  SubscriptionCommandServiceLive,
  SubscriptionQueryRepositoryLive,
  SubscriptionQueryServiceLive,
} from "@/domain/subscriptions";

import { EmailLive, PrismaLive } from "../infra.layers";
import { UserDepsLive } from "./user.layers";
import { WalletDepsLive } from "./wallet.layers";

export const SubscriptionReposLive = Layer.mergeAll(
  SubscriptionQueryRepositoryLive,
  SubscriptionCommandRepositoryLive,
).pipe(
  Layer.provide(PrismaLive),
);

export const SubscriptionServiceLayer = Layer.mergeAll(
  SubscriptionQueryServiceLive,
  SubscriptionCommandServiceLive,
).pipe(
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
