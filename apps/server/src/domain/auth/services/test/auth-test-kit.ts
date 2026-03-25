import type Redis from "ioredis";

import bcrypt from "bcrypt";
import { Effect, Layer } from "effect";
import { uuidv7 } from "uuidv7";

import type { PrismaClient } from "generated/prisma/client";

import { env } from "@/config/env";
import { makeUserRepository } from "@/domain/users/repository/user.repository";
import { runEffectWithLayer } from "@/test/effect/run";

import { makeAuthEventRepository } from "../../repository/auth-event.repository";
import { authRepositoryFactory } from "../../repository/auth.repository";
import { AuthServiceTag, makeAuthService } from "../auth.service";

export function makeAuthTestKit(args: {
  prisma: PrismaClient;
  redisClient: Redis;
}) {
  const authRepo = authRepositoryFactory(args.redisClient);
  const userRepo = makeUserRepository(args.prisma);

  const authService = makeAuthService({
    authRepo,
    authEventRepo: makeAuthEventRepository(args.prisma),
    userRepo,
    client: args.prisma,
  });

  const layer = Layer.succeed(AuthServiceTag, AuthServiceTag.make(authService));

  return {
    authRepo,
    userRepo,
    runWithService<A, E>(eff: Effect.Effect<A, E, AuthServiceTag>) {
      return runEffectWithLayer(eff, layer);
    },
    run<A, E>(f: (service: typeof authService) => Effect.Effect<A, E>) {
      return runEffectWithLayer(
        Effect.flatMap(AuthServiceTag, service => f(service)),
        layer,
      );
    },
    runEither<A, E>(f: (service: typeof authService) => Effect.Effect<A, E>) {
      return runEffectWithLayer(
        Effect.flatMap(AuthServiceTag, service => f(service).pipe(Effect.either)),
        layer,
      );
    },
    async createUser(input: {
      email: string;
      password: string;
      verify?: "UNVERIFIED" | "VERIFIED";
      accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
    }) {
      const id = uuidv7();
      const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

      await args.prisma.user.create({
        data: {
          id,
          fullName: "Auth User",
          email: input.email,
          passwordHash,
          role: "USER",
          accountStatus: input.accountStatus ?? "ACTIVE",
          verifyStatus: input.verify ?? "UNVERIFIED",
        },
      });

      return { id, email: input.email, passwordHash };
    },
  };
}
