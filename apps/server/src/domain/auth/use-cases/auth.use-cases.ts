import { Effect } from "effect";

import type { DuplicateUserEmail, DuplicateUserPhoneNumber } from "@/domain/users";

import { UserRepository } from "@/domain/users";
import { UserRepositoryError } from "@/domain/users/domain-errors";
import { WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";

import type { Tokens } from "../jwt";

import { AuthEventRepository } from "../repository/auth-event.repository";
import { AuthRepository } from "../repository/auth.repository";
import { AuthServiceTag, createSessionForUser, hashPassword } from "../services/auth.service";

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
    // TODO(architecture): This use-case reaches into `UserRepository`/`WalletRepository` (and Prisma tx) directly.
    // Consider moving "register user + create wallet + start session" orchestration into an AuthService method
    // (or an AuthRegistrationService) so the use-case only depends on domain services (not persistence adapters).
    const authRepo = yield* AuthRepository;
    const authEventRepo = yield* AuthEventRepository;
    const userRepo = yield* UserRepository;
    const walletRepo = yield* WalletRepository;
    const { client } = yield* Prisma;

    const passwordHash = yield* hashPassword(args.password);

    class TxAbort<E> extends Error {
      constructor(readonly payload: E) {
        super("TxAbort");
      }
    }

    const user = yield* Effect.tryPromise({
      try: () =>
        client.$transaction(async (tx) => {
          try {
            const created = await Effect.runPromise(userRepo.createUserInTx(tx, {
              fullname: args.fullname,
              email: args.email,
              passwordHash,
              phoneNumber: args.phoneNumber ?? null,
            }));
            await Effect.runPromise(walletRepo.createForUserInTx(tx, created.id));
            return created;
          }
          catch (err) {
            throw new TxAbort(err);
          }
        }),
      catch: (err) => {
        if (err instanceof TxAbort) {
          return err.payload;
        }
        return new UserRepositoryError({
          operation: "register.createUserWithWallet",
          cause: err,
        });
      },
    }).pipe(
      Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
      Effect.catchTag("WalletUniqueViolation", err => Effect.die(err)),
    );

    yield* authService.sendVerifyEmail({
      userId: user.id,
      email: user.email,
      fullName: user.fullname,
    });

    return yield* createSessionForUser(authRepo, authEventRepo, user);
  });
}
