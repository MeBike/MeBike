import { Effect } from "effect";

import type { DuplicateUserEmail, DuplicateUserPhoneNumber } from "@/domain/users";

import { UserRepository } from "@/domain/users";
import { UserRepositoryError } from "@/domain/users/domain-errors";
import { WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

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
  AuthServiceTag | AuthRepository | AuthEventRepository | UserRepository | WalletRepository | Prisma
> {
  return Effect.gen(function* () {
    const authService = yield* AuthServiceTag;
    const authRepo = yield* AuthRepository;
    const authEventRepo = yield* AuthEventRepository;
    const userRepo = yield* UserRepository;
    const walletRepo = yield* WalletRepository;
    const { client } = yield* Prisma;

    const passwordHash = yield* hashPassword(args.password);

    const user = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const created = yield* userRepo.createUserInTx(tx, {
          fullname: args.fullname,
          email: args.email,
          passwordHash,
          phoneNumber: args.phoneNumber ?? null,
        });
        yield* walletRepo.createForUserInTx(tx, created.id);
        return created;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err =>
        Effect.die(
          new UserRepositoryError({
            operation: "register.createUserWithWallet",
            cause: err.cause,
          }),
        )),
      Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
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
