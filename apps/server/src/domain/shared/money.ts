import type { Prisma as PrismaNS } from "generated/prisma/client";

export type MoneyInput = PrismaNS.Decimal | bigint | number | string | null | undefined;

export function toMinorUnit(value: MoneyInput, fallback: bigint = 0n): bigint {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new TypeError(`Invalid money amount: ${value}`);
    }
    return BigInt(value);
  }
  if (typeof value === "string") {
    if (value.includes(".")) {
      const [whole, frac] = value.split(".");
      const fractional = frac ?? "";
      if (fractional.replace(/0/g, "") !== "") {
        throw new Error(`Invalid money amount: ${value}`);
      }
      return BigInt(whole || "0");
    }
    return BigInt(value);
  }
  const text = value.toString();
  if (text.includes(".")) {
    const [whole, frac] = text.split(".");
    const fractional = frac ?? "";
    if (fractional.replace(/0/g, "") !== "") {
      throw new Error(`Invalid money amount: ${text}`);
    }
    return BigInt(whole || "0");
  }
  return BigInt(text);
}
