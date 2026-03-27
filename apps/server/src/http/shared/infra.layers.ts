import { Layer } from "effect";

import { EmailLive } from "@/infrastructure/email";
import { PrismaLive } from "@/infrastructure/prisma";
import { RedisLive } from "@/infrastructure/redis";
import { StripeLive } from "@/infrastructure/stripe";

export { EmailLive, PrismaLive, RedisLive, StripeLive };

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
