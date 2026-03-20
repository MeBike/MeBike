import { uuidv7 } from "uuidv7";

import type { CreatedSupplier, FactoryContext, SupplierOverrides } from "./types";

const defaults = {
  address: "123 Supplier Street",
  phoneNumber: "0900000000",
  contractFee: "10.00",
  status: "ACTIVE" as const,
};

export function createSupplierFactory(ctx: FactoryContext) {
  let counter = 0;

  return async (overrides: SupplierOverrides = {}): Promise<CreatedSupplier> => {
    counter++;
    const id = overrides.id ?? uuidv7();
    const name = overrides.name ?? `Supplier ${counter}`;

    await ctx.prisma.supplier.create({
      data: {
        id,
        name,
        address: overrides.address ?? defaults.address,
        phoneNumber: overrides.phoneNumber ?? defaults.phoneNumber,
        contractFee: overrides.contractFee ?? defaults.contractFee,
        status: overrides.status ?? defaults.status,
        updatedAt: new Date(),
      },
    });

    return { id, name };
  };
}

export type SupplierFactory = ReturnType<typeof createSupplierFactory>;
