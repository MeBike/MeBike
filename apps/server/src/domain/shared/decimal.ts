import { Prisma as PrismaNS } from "generated/prisma/client";

export type Decimalish = PrismaNS.Decimal | number | string | undefined;

export function toPrismaDecimal(value: Decimalish, fallback = "0"): PrismaNS.Decimal {
  if (value instanceof PrismaNS.Decimal) {
    return value;
  }
  return new PrismaNS.Decimal(value ?? fallback);
}
