import type { Job } from "pg-boss";

import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { handlePushSend } from "@/worker/push-worker";
import { PrismaClient } from "generated/prisma/client";

type TestContainer = { stop: () => Promise<void>; url: string };

const { sendPushNotificationsAsyncMock } = vi.hoisted(() => ({
  sendPushNotificationsAsyncMock: vi.fn(),
}));

vi.mock("expo-server-sdk", () => {
  class Expo {
    static isExpoPushToken(token: string): boolean {
      return /^ExponentPushToken\[[\w-]+\]$/.test(token)
        || /^ExpoPushToken\[[\w-]+\]$/.test(token);
    }

    chunkPushNotifications<T>(messages: T[]): T[][] {
      return [messages];
    }

    async sendPushNotificationsAsync(messages: unknown[]) {
      return sendPushNotificationsAsyncMock(messages);
    }
  }

  return { Expo };
});

function makeJob(data: unknown): Job<unknown> {
  return {
    id: "job-push-1",
    name: JobTypes.PushSend,
    data,
  } as Job<unknown>;
}

describe("push worker integration", () => {
  let container: TestContainer;
  let client: PrismaClient;

  beforeAll(async () => {
    container = await getTestDatabase();
    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
  }, 60000);

  beforeEach(async () => {
    sendPushNotificationsAsyncMock.mockReset();
    await client.pushToken.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client) {
      await client.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  it("sends push and deactivates invalid/unregistered tokens", async () => {
    const user = await client.user.create({
      data: {
        fullname: "Push User",
        email: "push-user@example.com",
        passwordHash: "hash",
      },
    });

    const invalidToken = "not-a-valid-expo-token";
    const deliveredToken = "ExponentPushToken[delivered-token]";
    const unregisteredToken = "ExponentPushToken[unregistered-token]";
    const errorToken = "ExponentPushToken[error-token]";

    await client.pushToken.createMany({
      data: [
        { userId: user.id, token: invalidToken, updatedAt: new Date() },
        { userId: user.id, token: deliveredToken, updatedAt: new Date() },
        { userId: user.id, token: unregisteredToken, updatedAt: new Date() },
        { userId: user.id, token: errorToken, updatedAt: new Date() },
      ],
    });

    sendPushNotificationsAsyncMock.mockImplementationOnce(
      async (messages: Array<{ to: string }>) =>
        messages.map((message) => {
          if (message.to === deliveredToken) {
            return { status: "ok" as const };
          }
          if (message.to === unregisteredToken) {
            return {
              status: "error" as const,
              details: { error: "DeviceNotRegistered" },
              message: "Device not registered",
            };
          }
          return {
            status: "error" as const,
            details: { error: "MessageRateExceeded" },
            message: "Rate exceeded",
          };
        }),
    );

    await handlePushSend(
      makeJob({
        version: 1,
        userId: user.id,
        event: "reservations.nearExpiry",
        title: "Reservation expiring soon",
        body: "Body",
        channelId: "default",
        data: { reservationId: "reservation-1" },
      }),
    );

    expect(sendPushNotificationsAsyncMock).toHaveBeenCalledTimes(1);

    const rows = await client.pushToken.findMany({
      where: { userId: user.id },
      select: { token: true, isActive: true },
    });
    const byToken = Object.fromEntries(rows.map(row => [row.token, row.isActive]));

    expect(byToken[invalidToken]).toBe(false);
    expect(byToken[unregisteredToken]).toBe(false);
    expect(byToken[deliveredToken]).toBe(true);
    expect(byToken[errorToken]).toBe(true);
  });

  it("is no-op when user has no active tokens", async () => {
    const user = await client.user.create({
      data: {
        fullname: "No Token User",
        email: "no-token-user@example.com",
        passwordHash: "hash",
      },
    });

    await handlePushSend(
      makeJob({
        version: 1,
        userId: user.id,
        event: "reservations.nearExpiry",
        title: "No tokens",
        body: "Body",
        channelId: "default",
        data: { reservationId: "reservation-2" },
      }),
    );

    expect(sendPushNotificationsAsyncMock).not.toHaveBeenCalled();
  });

  it("continues when provider fails and keeps tokens active", async () => {
    const user = await client.user.create({
      data: {
        fullname: "Provider Failure User",
        email: "provider-failure@example.com",
        passwordHash: "hash",
      },
    });

    const token = "ExponentPushToken[provider-failure-token]";
    await client.pushToken.create({
      data: { userId: user.id, token, updatedAt: new Date() },
    });

    sendPushNotificationsAsyncMock.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(
      handlePushSend(
        makeJob({
          version: 1,
          userId: user.id,
          event: "reservations.expired",
          title: "Expired",
          body: "Body",
          channelId: "default",
          data: { reservationId: "reservation-3" },
        }),
      ),
    ).resolves.toBeUndefined();

    const row = await client.pushToken.findUnique({
      where: { token },
      select: { isActive: true },
    });
    expect(row?.isActive).toBe(true);
  });
});
