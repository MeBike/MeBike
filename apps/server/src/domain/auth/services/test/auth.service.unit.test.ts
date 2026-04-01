import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import type { UserRow } from "@/domain/users";

import { expectDefect } from "@/test/effect/assertions";

import type { AuthEventRepo } from "../../repository/auth-event.repository";
import type { AuthRepo } from "../../repository/auth.repository";

import { AuthEventRepositoryError, AuthRepositoryError } from "../../domain-errors";
import { createSessionForUser } from "../auth.service";

const user: UserRow = {
  id: "user-1",
  fullname: "Auth User",
  email: "auth@example.com",
  phoneNumber: null,
  username: null,
  passwordHash: "hash",
  avatar: null,
  location: null,
  role: "USER",
  accountStatus: "ACTIVE",
  verify: "VERIFIED",
  orgAssignment: null,
  nfcCardUid: null,
  stripeConnectedAccountId: null,
  stripePayoutsEnabled: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

function unexpectedAuthRepoCall() {
  return Effect.die(new Error("Unexpected AuthRepo call"));
}

function makeUnusedAuthRepoMethods(): Omit<AuthRepo, "saveSession"> {
  return {
    getSession: unexpectedAuthRepoCall as AuthRepo["getSession"],
    deleteSession: unexpectedAuthRepoCall as AuthRepo["deleteSession"],
    deleteAllSessionsForUser: unexpectedAuthRepoCall as AuthRepo["deleteAllSessionsForUser"],
    saveEmailOtp: unexpectedAuthRepoCall as AuthRepo["saveEmailOtp"],
    getEmailOtp: unexpectedAuthRepoCall as AuthRepo["getEmailOtp"],
    consumeEmailOtp: unexpectedAuthRepoCall as AuthRepo["consumeEmailOtp"],
    verifyEmailOtpAttempt: unexpectedAuthRepoCall as AuthRepo["verifyEmailOtpAttempt"],
    saveResetPasswordToken: unexpectedAuthRepoCall as AuthRepo["saveResetPasswordToken"],
    consumeResetPasswordToken: unexpectedAuthRepoCall as AuthRepo["consumeResetPasswordToken"],
  };
}

describe("createSessionForUser", () => {
  it("still succeeds when auth event persistence defects", async () => {
    const authRepo: AuthRepo = {
      saveSession: () => Effect.void,
      ...makeUnusedAuthRepoMethods(),
    };
    const authEventRepo: AuthEventRepo = {
      recordSessionIssued: () => Effect.die(new AuthEventRepositoryError({ operation: "recordSessionIssued" })),
    };

    const result = await Effect.runPromise(createSessionForUser(authRepo, authEventRepo, user));

    expect(result.accessToken).toBeTypeOf("string");
    expect(result.refreshToken).toBeTypeOf("string");
  });

  it("defects when session persistence defects", async () => {
    const authRepo: AuthRepo = {
      saveSession: () => Effect.die(new AuthRepositoryError({ operation: "saveSession" })),
      ...makeUnusedAuthRepoMethods(),
    };
    const authEventRepo: AuthEventRepo = {
      recordSessionIssued: () => Effect.void,
    };

    await expectDefect(
      createSessionForUser(authRepo, authEventRepo, user),
      AuthRepositoryError,
    );
  });
});
