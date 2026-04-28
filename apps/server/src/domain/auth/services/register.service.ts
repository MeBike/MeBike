import { Effect } from "effect";

import type { DuplicateUserEmail, DuplicateUserPhoneNumber } from "@/domain/users";

import { defectOn } from "@/domain/shared";
import { makeUserCommandRepository } from "@/domain/users";
import { makeWalletCommandRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { Tokens } from "../jwt";

import { AuthEventRepository } from "../repository/auth-event.repository";
import { AuthRepository } from "../repository/auth.repository";
import { AuthServiceTag, createSessionForUser, hashPassword } from "./auth.service";

export function registerUseCase(args: {
  fullname: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
}): Effect.Effect<
  Tokens,
  DuplicateUserEmail | DuplicateUserPhoneNumber,
  AuthServiceTag | AuthRepository | AuthEventRepository | Prisma
> {
  return Effect.gen(function* () {
    const authService = yield* AuthServiceTag;
    const authRepo = yield* AuthRepository;
    const authEventRepo = yield* AuthEventRepository;
    const { client } = yield* Prisma;

    const passwordHash = yield* hashPassword(args.password);

    const user = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const userCommandRepo = makeUserCommandRepository(tx);
        const created = yield* userCommandRepo.createRegisteredUser({
          fullname: args.fullname,
          email: args.email,
          passwordHash,
          phoneNumber: args.phoneNumber ?? null,
        });
        yield* makeWalletCommandRepository(tx).createForUser(created.id);
        return created;
      })).pipe(
      defectOn(PrismaTransactionError),
      Effect.catchTag("WalletUniqueViolation", err => Effect.die(err)),
    );
    // hmm not transactional, but ok
    yield* authService.sendVerifyEmail({
      userId: user.id,
      email: user.email,
      fullName: user.fullname,
    });

    return yield* createSessionForUser(authRepo, authEventRepo, user);
  });
}
