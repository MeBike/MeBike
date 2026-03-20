import { uuidv7 } from "uuidv7";

import type { CreatedPushToken, FactoryContext, PushTokenOverrides } from "./types";

const defaults = {
  platform: "UNKNOWN" as const,
  deviceId: null,
  appVersion: null,
  isActive: true,
  lastSeenAt: () => new Date(),
};

export function createPushTokenFactory(ctx: FactoryContext) {
  let counter = 0;

  return async (overrides: PushTokenOverrides): Promise<CreatedPushToken> => {
    counter++;
    const id = overrides.id ?? uuidv7();

    if (!overrides.userId) {
      throw new Error("userId is required for createPushToken");
    }

    const token = overrides.token ?? `ExponentPushToken[test-${counter}-${id.slice(0, 8)}]`;

    await ctx.prisma.pushToken.create({
      data: {
        id,
        userId: overrides.userId,
        token,
        platform: overrides.platform ?? defaults.platform,
        deviceId: overrides.deviceId ?? defaults.deviceId,
        appVersion: overrides.appVersion ?? defaults.appVersion,
        isActive: overrides.isActive ?? defaults.isActive,
        lastSeenAt: overrides.lastSeenAt ?? defaults.lastSeenAt(),
      },
    });

    return { id, userId: overrides.userId, token };
  };
}

export type PushTokenFactory = ReturnType<typeof createPushTokenFactory>;
