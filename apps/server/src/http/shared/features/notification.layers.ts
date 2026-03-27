import { Layer } from "effect";

import {
  PushNotificationServiceLive,
  PushTokenRepositoryLive,
} from "@/domain/notifications";

import { PrismaLive } from "../infra.layers";

export const PushTokenReposLive = PushTokenRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const PushNotificationServiceLayer = PushNotificationServiceLive.pipe(
  Layer.provide(PushTokenReposLive),
);

export const NotificationDepsLive = Layer.mergeAll(
  PushTokenReposLive,
  PushNotificationServiceLayer,
  PrismaLive,
);
