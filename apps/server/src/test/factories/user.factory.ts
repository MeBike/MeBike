import { uuidv7 } from "uuidv7";

import type { CreatedUser, FactoryContext, UserOverrides } from "./types";

const defaults = {
  fullname: "Test User",
  passwordHash: "hash123",
  phoneNumber: null,
  username: null,
  avatar: null,
  location: null,
  role: "USER" as const,
  accountStatus: "ACTIVE" as const,
  verify: "VERIFIED" as const,
};

export function createUserFactory(ctx: FactoryContext) {
  return async (overrides: UserOverrides = {}): Promise<CreatedUser> => {
    const id = overrides.id ?? uuidv7();
    const email = overrides.email ?? `user-${id}@test.example.com`;

    await ctx.prisma.user.create({
      data: {
        id,
        fullName: overrides.fullname ?? defaults.fullname,
        email,
        passwordHash: overrides.passwordHash ?? defaults.passwordHash,
        phoneNumber: overrides.phoneNumber ?? defaults.phoneNumber,
        username: overrides.username ?? defaults.username,
        avatarUrl: overrides.avatar ?? defaults.avatar,
        locationText: overrides.location ?? defaults.location,
        role: overrides.role ?? defaults.role,
        accountStatus: overrides.accountStatus ?? defaults.accountStatus,
        verifyStatus: overrides.verify ?? defaults.verify,
      },
    });

    if (overrides.nfcCardUid) {
      await ctx.prisma.nfcCard.create({
        data: {
          uid: overrides.nfcCardUid,
          status: "ACTIVE",
          assignedUserId: id,
          issuedAt: new Date(),
        },
      });
    }

    return { id, email, role: overrides.role ?? defaults.role };
  };
}

export type UserFactory = ReturnType<typeof createUserFactory>;
