import { uuidv7 } from "uuidv7";

import type { CreatedWallet, FactoryContext, WalletOverrides } from "./types";

const defaults = {
  balance: BigInt(0),
  reservedBalance: BigInt(0),
  status: "ACTIVE" as const,
};

export function createWalletFactory(ctx: FactoryContext) {
  return async (overrides: WalletOverrides): Promise<CreatedWallet> => {
    const id = overrides.id ?? uuidv7();

    if (!overrides.userId) {
      throw new Error("userId is required for createWallet");
    }

    await ctx.prisma.wallet.create({
      data: {
        id,
        userId: overrides.userId,
        balance: overrides.balance ?? defaults.balance,
        reservedBalance: overrides.reservedBalance ?? defaults.reservedBalance,
        status: overrides.status ?? defaults.status,
      },
    });

    return { id, userId: overrides.userId };
  };
}

export type WalletFactory = ReturnType<typeof createWalletFactory>;
