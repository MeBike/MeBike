import { Effect } from "effect";

import type { DuplicateUserEmail, DuplicateUserPhoneNumber } from "@/domain/users";

import { UserRepository } from "@/domain/users";
import { UserRepositoryError } from "@/domain/users/domain-errors";
import { WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";

import type {
  AuthFailure,
  InvalidOtp,
} from "../domain-errors";
import type { Tokens } from "../jwt";

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
  AuthServiceTag | AuthRepository | UserRepository | WalletRepository | Prisma
> {
  return Effect.gen(function* () {
    const authService = yield* AuthServiceTag;
    const authRepo = yield* AuthRepository;
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

    return yield* createSessionForUser(authRepo, user);
  });
}

export function loginWithPasswordUseCase(args: {
  email: string;
  password: string;
}): Effect.Effect<Tokens, AuthFailure, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.loginWithPassword(args);
  });
}

export function refreshTokensUseCase(args: {
  refreshToken: string;
}): Effect.Effect<Tokens, AuthFailure, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.refreshTokens(args);
  });
}

export function logoutUseCase(args: {
  sessionId: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.logout(args);
  });
}

export function logoutAllUseCase(args: {
  userId: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.logoutAll(args);
  });
}

export function sendVerifyEmailUseCase(args: {
  userId: string;
  email: string;
  fullName: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.sendVerifyEmail(args);
  });
}

export function resendVerifyEmailUseCase(args: {
  userId: string;
  email: string;
  fullName: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  // reuse existing use case ALSO NO RATELIMIT HERE TODO ADD IT LATER
  return sendVerifyEmailUseCase(args);
}

export function verifyEmailOtpUseCase(args: {
  userId: string;
  otp: string;
}): Effect.Effect<void, InvalidOtp, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.verifyEmailOtp(args);
  });
}

export function sendResetPasswordUseCase(args: {
  email: string;
}): Effect.Effect<void, never, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.sendResetPassword(args);
  });
}

export function resetPasswordUseCase(args: {
  email: string;
  otp: string;
  newPassword: string;
}): Effect.Effect<void, InvalidOtp, AuthServiceTag> {
  return Effect.gen(function* () {
    const service = yield* AuthServiceTag;
    return yield* service.resetPassword(args);
  });
}
