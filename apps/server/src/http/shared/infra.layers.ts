import { Layer } from "effect";

import { EmailLive } from "@/infrastructure/email";
import { FirebaseStorageLive } from "@/infrastructure/firebase";
import { PrismaLive } from "@/infrastructure/prisma";
import { RedisLive } from "@/infrastructure/redis";
import { StripeLive } from "@/infrastructure/stripe";

export { EmailLive, FirebaseStorageLive, PrismaLive, RedisLive, StripeLive };

export const PersistenceInfraLive = Layer.mergeAll(
  PrismaLive,
  RedisLive,
);

export const ExternalInfraLive = Layer.mergeAll(
  EmailLive,
  StripeLive,
);

export const AppInfraLive = Layer.mergeAll(
  PersistenceInfraLive,
  ExternalInfraLive,
);
