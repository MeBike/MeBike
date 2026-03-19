import { uuidv7 } from "uuidv7";

import type { CreatedUser, FactoryContext, UserOverrides } from "./types";

const defaults = {
  fullname: "Test User",
  passwordHash: "hash123",
  phoneNumber: null,
  username: null,
  avatar: null,
  location: null,
  nfcCardUid: null,
  role: "USER" as const,
  verify: "VERIFIED" as const,
};

export function createUserFactory(ctx: FactoryContext) {
  return async (overrides: UserOverrides = {}): Promise<CreatedUser> => {
    const id = overrides.id ?? uuidv7();
    const email = overrides.email ?? `user-${id}@test.example.com`;

    await ctx.prisma.user.create({
      data: {
        id,
        fullname: overrides.fullname ?? defaults.fullname,
        email,
        passwordHash: overrides.passwordHash ?? defaults.passwordHash,
        phoneNumber: overrides.phoneNumber ?? defaults.phoneNumber,
        username: overrides.username ?? defaults.username,
        avatar: overrides.avatar ?? defaults.avatar,
        location: overrides.location ?? defaults.location,
        nfcCardUid: overrides.nfcCardUid ?? defaults.nfcCardUid,
        role: overrides.role ?? defaults.role,
        verify: overrides.verify ?? defaults.verify,
      },
    });

    return { id, email, role: overrides.role ?? defaults.role };
  };
}

export type UserFactory = ReturnType<typeof createUserFactory>;
