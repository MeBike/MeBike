import { Effect, Either, Match, Option } from "effect";
import Redis from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startRedis } from "@/test/db/redis";

import type {
  EmailOtpRecord,
  RefreshSession,
  ResetPasswordTokenRecord,
} from "../../models";

import { OTP_MAX_ATTEMPTS } from "../../config";
import { authRepositoryFactory } from "../auth.repository";

describe("authRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let repo: ReturnType<typeof authRepositoryFactory>;

  beforeAll(async () => {
    container = await startRedis();
    // Create ioredis client from the test container URL
    const client = new Redis(container.url);
    repo = authRepositoryFactory(client);
  }, 60000);

  afterAll(async () => {
    if (container)
      await container.stop();
  });

  describe("session Management", () => {
    const mockSession: RefreshSession = {
      sessionId: "session-123",
      userId: "user-456",
      refreshToken: "refresh-token-abc",
      issuedAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    };

    it("saveSession: successfully saves a session", async () => {
      const result = await Effect.runPromise(repo.saveSession(mockSession));

      expect(result).toBeUndefined();
    });

    it("getSession: retrieves a saved session", async () => {
      const result = await Effect.runPromise(repo.getSession(mockSession.sessionId));

      if (Option.isNone(result)) {
        throw new Error("Expected session to be present");
      }

      const session = result.value;
      expect(session.sessionId).toBe(mockSession.sessionId);
      expect(session.userId).toBe(mockSession.userId);
      expect(session.refreshToken).toBe(mockSession.refreshToken);
      expect(session.issuedAt).toEqual(mockSession.issuedAt);
      expect(session.expiresAt.getTime()).toBeCloseTo(mockSession.expiresAt.getTime(), -2);
    });

    it("getSession: returns Option.none for non-existent session", async () => {
      const result = await Effect.runPromise(repo.getSession("non-existent-session"));

      expect(Option.isNone(result)).toBe(true);
    });

    it("deleteSession: successfully deletes a session", async () => {
      const testSession: RefreshSession = {
        sessionId: "session-to-delete",
        userId: "user-789",
        refreshToken: "refresh-token-delete",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      await Effect.runPromise(repo.saveSession(testSession));

      // Verify session exists
      const beforeDelete = await Effect.runPromise(repo.getSession(testSession.sessionId));
      expect(Option.isSome(beforeDelete)).toBe(true);

      // Delete session
      await Effect.runPromise(repo.deleteSession(testSession.sessionId));

      // Verify session is gone
      const afterDelete = await Effect.runPromise(repo.getSession(testSession.sessionId));
      expect(Option.isNone(afterDelete)).toBe(true);
    });

    it("deleteSession: is idempotent (no error when deleting non-existent session)", async () => {
      const result = await Effect.runPromise(repo.deleteSession("already-deleted-session"));

      expect(result).toBeUndefined();
    });

    it("deleteAllSessionsForUser: deletes all user sessions", async () => {
      const userId = "user-multi-session";

      // Create multiple sessions for the same user
      const session1: RefreshSession = {
        sessionId: "session-1",
        userId,
        refreshToken: "token-1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      const session2: RefreshSession = {
        sessionId: "session-2",
        userId,
        refreshToken: "token-2",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      const session3: RefreshSession = {
        sessionId: "session-3",
        userId: "other-user",
        refreshToken: "token-3",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      await Effect.runPromise(repo.saveSession(session1));
      await Effect.runPromise(repo.saveSession(session2));
      await Effect.runPromise(repo.saveSession(session3));

      // Verify all sessions exist
      expect(Option.isSome(await Effect.runPromise(repo.getSession(session1.sessionId)))).toBe(true);
      expect(Option.isSome(await Effect.runPromise(repo.getSession(session2.sessionId)))).toBe(true);
      expect(Option.isSome(await Effect.runPromise(repo.getSession(session3.sessionId)))).toBe(true);

      // Delete all sessions for the user
      await Effect.runPromise(repo.deleteAllSessionsForUser(userId));

      // Verify user's sessions are deleted
      expect(Option.isNone(await Effect.runPromise(repo.getSession(session1.sessionId)))).toBe(true);
      expect(Option.isNone(await Effect.runPromise(repo.getSession(session2.sessionId)))).toBe(true);

      // Verify other user's session still exists
      expect(Option.isSome(await Effect.runPromise(repo.getSession(session3.sessionId)))).toBe(true);
    });

    it("deleteAllSessionsForUser: is idempotent (no error when user has no sessions)", async () => {
      const result = await Effect.runPromise(repo.deleteAllSessionsForUser("user-with-no-sessions"));

      expect(result).toBeUndefined();
    });
  });

  describe("email OTP Management", () => {
    const mockOtp: EmailOtpRecord = {
      userId: "user-otp-123",
      email: "test@example.com",
      kind: "verify-email",
      otp: "123456",
      expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
    };

    it("saveEmailOtp: successfully saves an OTP record", async () => {
      const result = await Effect.runPromise(repo.saveEmailOtp(mockOtp));

      expect(result).toBeUndefined();
    });

    it("consumeEmailOtp: retrieves and deletes an OTP record", async () => {
      const testOtp: EmailOtpRecord = {
        userId: "user-consume-otp",
        email: "consume@example.com",
        kind: "reset-password",
        otp: "654321",
        expiresAt: new Date(Date.now() + 300000),
      };

      await Effect.runPromise(repo.saveEmailOtp(testOtp));

      const result = await Effect.runPromise(repo.consumeEmailOtp({ userId: testOtp.userId, kind: testOtp.kind }));

      if (Option.isNone(result)) {
        throw new Error("Expected OTP to be present");
      }

      const otp = result.value;
      expect(otp.userId).toBe(testOtp.userId);
      expect(otp.email).toBe(testOtp.email);
      expect(otp.kind).toBe(testOtp.kind);
      expect(otp.otp).toBe(testOtp.otp);
    });

    it("consumeEmailOtp: deletes the OTP after retrieval", async () => {
      const testOtp: EmailOtpRecord = {
        userId: "user-consume-delete",
        email: "consume-delete@example.com",
        kind: "verify-email",
        otp: "111111",
        expiresAt: new Date(Date.now() + 300000),
      };

      await Effect.runPromise(repo.saveEmailOtp(testOtp));

      // First consume should return the OTP
      const firstConsume = await Effect.runPromise(repo.consumeEmailOtp({ userId: testOtp.userId, kind: testOtp.kind }));
      expect(Option.isSome(firstConsume)).toBe(true);

      // Second consume should return none (already consumed)
      const secondConsume = await Effect.runPromise(repo.consumeEmailOtp({ userId: testOtp.userId, kind: testOtp.kind }));
      expect(Option.isNone(secondConsume)).toBe(true);
    });

    it("consumeEmailOtp: returns Option.none for non-existent OTP", async () => {
      const result = await Effect.runPromise(
        repo.consumeEmailOtp({ userId: "non-existent-user", kind: "verify-email" }),
      );

      expect(Option.isNone(result)).toBe(true);
    });

    it("consumeEmailOtp: returns correct OTP for different kinds", async () => {
      const userId = "user-multiple-kinds";

      const verifyOtp: EmailOtpRecord = {
        userId,
        email: "verify@example.com",
        kind: "verify-email",
        otp: "222222",
        expiresAt: new Date(Date.now() + 300000),
      };

      const resetOtp: EmailOtpRecord = {
        userId,
        email: "reset@example.com",
        kind: "reset-password",
        otp: "333333",
        expiresAt: new Date(Date.now() + 300000),
      };

      await Effect.runPromise(repo.saveEmailOtp(verifyOtp));
      await Effect.runPromise(repo.saveEmailOtp(resetOtp));

      const verifyResult = await Effect.runPromise(repo.consumeEmailOtp({ userId, kind: "verify-email" }));
      const resetResult = await Effect.runPromise(repo.consumeEmailOtp({ userId, kind: "reset-password" }));

      if (Option.isNone(verifyResult)) {
        throw new Error("Expected verify OTP");
      }
      expect(verifyResult.value.otp).toBe("222222");

      if (Option.isNone(resetResult)) {
        throw new Error("Expected reset OTP");
      }
      expect(resetResult.value.otp).toBe("333333");
    });

    it("verifyEmailOtpAttempt: decrements attempts and keeps otp until limit", async () => {
      const userId = "user-attempts";
      const testOtp: EmailOtpRecord = {
        userId,
        email: "attempts@example.com",
        kind: "reset-password",
        otp: "123456",
        expiresAt: new Date(Date.now() + 300000),
      };

      await Effect.runPromise(repo.saveEmailOtp(testOtp));

      for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i += 1) {
        const status = await Effect.runPromise(
          repo.verifyEmailOtpAttempt({
            userId,
            kind: "reset-password",
            otp: "000000",
            email: "attempts@example.com",
          }),
        );
        expect(status).toBe("invalidRetryable");
      }

      const stillPresent = await Effect.runPromise(repo.getEmailOtp({ userId, kind: "reset-password" }));
      expect(Option.isSome(stillPresent)).toBe(true);

      const finalStatus = await Effect.runPromise(
        repo.verifyEmailOtpAttempt({
          userId,
          kind: "reset-password",
          otp: "000000",
          email: "attempts@example.com",
        }),
      );
      expect(finalStatus).toBe("invalidTerminal");

      const removed = await Effect.runPromise(repo.getEmailOtp({ userId, kind: "reset-password" }));
      expect(Option.isNone(removed)).toBe(true);
    });

    it("verifyEmailOtpAttempt: consumes otp on valid attempt", async () => {
      const userId = "user-valid-attempt";
      const testOtp: EmailOtpRecord = {
        userId,
        email: "valid-attempt@example.com",
        kind: "verify-email",
        otp: "654321",
        expiresAt: new Date(Date.now() + 300000),
      };

      await Effect.runPromise(repo.saveEmailOtp(testOtp));

      const status = await Effect.runPromise(
        repo.verifyEmailOtpAttempt({
          userId,
          kind: "verify-email",
          otp: "654321",
        }),
      );

      expect(status).toBe("valid");
      const removed = await Effect.runPromise(repo.getEmailOtp({ userId, kind: "verify-email" }));
      expect(Option.isNone(removed)).toBe(true);
    });

    it("saveResetPasswordToken + consumeResetPasswordToken: consumes token once", async () => {
      const tokenRecord: ResetPasswordTokenRecord = {
        token: "reset-token-123",
        userId: "user-reset-token",
        email: "reset-token@example.com",
        expiresAt: new Date(Date.now() + 300000),
      };

      await Effect.runPromise(repo.saveResetPasswordToken(tokenRecord));

      const first = await Effect.runPromise(repo.consumeResetPasswordToken(tokenRecord.token));
      expect(Option.isSome(first)).toBe(true);
      if (Option.isSome(first)) {
        expect(first.value.userId).toBe(tokenRecord.userId);
        expect(first.value.email).toBe(tokenRecord.email);
      }

      const second = await Effect.runPromise(repo.consumeResetPasswordToken(tokenRecord.token));
      expect(Option.isNone(second)).toBe(true);
    });
  });

  describe("failure Scenarios", () => {
    it("saveSession: returns AuthRepositoryError when Redis connection fails", async () => {
      // Create a repo with invalid Redis connection
      const invalidClient = new Redis("redis://invalid:6379", {
        connectTimeout: 100,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });

      const invalidRepo = authRepositoryFactory(invalidClient);

      const testSession: RefreshSession = {
        sessionId: "fail-session",
        userId: "fail-user",
        refreshToken: "fail-token",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      const result = await Effect.runPromise(
        invalidRepo.saveSession(testSession).pipe(Effect.either),
      );

      if (Either.isLeft(result)) {
        Match.value(result.left).pipe(
          Match.tag("AuthRepositoryError", (error) => {
            expect(error.operation).toBe("saveSession");
          }),
          Match.orElse(() => {
            throw new Error("Expected AuthRepositoryError");
          }),
        );
      }
      else {
        throw new Error("Expected failure but got success");
      }

      try {
        await invalidClient.quit();
      }
      catch {
        // Connection already closed, ignore
      }
    });

    it("getSession: returns AuthRepositoryError when Redis connection fails", async () => {
      const invalidClient = new Redis("redis://invalid:6379", {
        connectTimeout: 100,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });

      const invalidRepo = authRepositoryFactory(invalidClient);

      const result = await Effect.runPromise(
        invalidRepo.getSession("test-session").pipe(Effect.either),
      );

      if (Either.isLeft(result)) {
        Match.value(result.left).pipe(
          Match.tag("AuthRepositoryError", (error) => {
            expect(error.operation).toBe("getSession");
          }),
          Match.orElse(() => {
            throw new Error("Expected AuthRepositoryError");
          }),
        );
      }
      else {
        throw new Error("Expected failure but got success");
      }

      try {
        await invalidClient.quit();
      }
      catch {
        // Connection already closed, ignore
      }
    });

    it("deleteSession: returns AuthRepositoryError when Redis connection fails", async () => {
      const invalidClient = new Redis("redis://invalid:6379", {
        connectTimeout: 100,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });

      const invalidRepo = authRepositoryFactory(invalidClient);

      const result = await Effect.runPromise(
        invalidRepo.deleteSession("test-session").pipe(Effect.either),
      );

      if (Either.isLeft(result)) {
        Match.value(result.left).pipe(
          Match.tag("AuthRepositoryError", (error) => {
            expect(error.operation).toBe("deleteSession");
          }),
          Match.orElse(() => {
            throw new Error("Expected AuthRepositoryError");
          }),
        );
      }
      else {
        throw new Error("Expected failure but got success");
      }

      try {
        await invalidClient.quit();
      }
      catch {
        // Connection already closed, ignore
      }
    });

    it("deleteAllSessionsForUser: returns AuthRepositoryError when Redis connection fails", async () => {
      const invalidClient = new Redis("redis://invalid:6379", {
        connectTimeout: 100,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });

      const invalidRepo = authRepositoryFactory(invalidClient);

      const result = await Effect.runPromise(
        invalidRepo.deleteAllSessionsForUser("test-user").pipe(Effect.either),
      );

      if (Either.isLeft(result)) {
        Match.value(result.left).pipe(
          Match.tag("AuthRepositoryError", (error) => {
            expect(error.operation).toBe("deleteAllSessionsForUser");
          }),
          Match.orElse(() => {
            throw new Error("Expected AuthRepositoryError");
          }),
        );
      }
      else {
        throw new Error("Expected failure but got success");
      }

      try {
        await invalidClient.quit();
      }
      catch {
        // Connection already closed, ignore
      }
    });

    it("saveEmailOtp: returns AuthRepositoryError when Redis connection fails", async () => {
      const invalidClient = new Redis("redis://invalid:6379", {
        connectTimeout: 100,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });

      const invalidRepo = authRepositoryFactory(invalidClient);

      const testOtp: EmailOtpRecord = {
        userId: "fail-user",
        email: "fail@example.com",
        kind: "verify-email",
        otp: "000000",
        expiresAt: new Date(Date.now() + 300000),
      };

      const result = await Effect.runPromise(
        invalidRepo.saveEmailOtp(testOtp).pipe(Effect.either),
      );

      if (Either.isLeft(result)) {
        Match.value(result.left).pipe(
          Match.tag("AuthRepositoryError", (error) => {
            expect(error.operation).toBe("saveEmailOtp");
          }),
          Match.orElse(() => {
            throw new Error("Expected AuthRepositoryError");
          }),
        );
      }
      else {
        throw new Error("Expected failure but got success");
      }

      try {
        await invalidClient.quit();
      }
      catch {
        // Connection already closed, ignore
      }
    });

    it("consumeEmailOtp: returns AuthRepositoryError when Redis connection fails", async () => {
      const invalidClient = new Redis("redis://invalid:6379", {
        connectTimeout: 100,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });

      const invalidRepo = authRepositoryFactory(invalidClient);

      const result = await Effect.runPromise(
        invalidRepo.consumeEmailOtp({ userId: "test-user", kind: "verify-email" }).pipe(Effect.either),
      );

      if (Either.isLeft(result)) {
        Match.value(result.left).pipe(
          Match.tag("AuthRepositoryError", (error) => {
            expect(error.operation).toBe("consumeEmailOtp");
          }),
          Match.orElse(() => {
            throw new Error("Expected AuthRepositoryError");
          }),
        );
      }
      else {
        throw new Error("Expected failure but got success");
      }

      try {
        await invalidClient.quit();
      }
      catch {
        // Connection already closed, ignore
      }
    });
  });
});
