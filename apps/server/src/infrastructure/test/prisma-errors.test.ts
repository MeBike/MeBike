import { describe, expect, it } from "vitest";

import { Prisma as PrismaTypes } from "generated/prisma/client";

import { isPrismaRawUniqueViolation } from "@/infrastructure/prisma-errors";

function makeKnownRequestError(args: {
  code: string;
  meta?: unknown;
}): PrismaTypes.PrismaClientKnownRequestError {
  const error = Object.create(
    PrismaTypes.PrismaClientKnownRequestError.prototype,
  ) as PrismaTypes.PrismaClientKnownRequestError;
  Object.assign(error, {
    code: args.code,
    meta: args.meta,
    clientVersion: "test",
    name: "PrismaClientKnownRequestError",
    message: "test",
  });
  return error;
}

describe("isPrismaRawUniqueViolation", () => {
  it("returns true for P2010 wrapping postgres 23505", () => {
    const error = makeKnownRequestError({
      code: "P2010",
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: "23505",
          },
        },
      },
    });

    expect(isPrismaRawUniqueViolation(error)).toBe(true);
  });

  it("returns false for non-known-request errors", () => {
    expect(isPrismaRawUniqueViolation(new Error("x"))).toBe(false);
    expect(isPrismaRawUniqueViolation({ code: "P2010" })).toBe(false);
  });

  it("returns false when code is not P2010", () => {
    const error = makeKnownRequestError({
      code: "P2002",
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: "23505",
          },
        },
      },
    });

    expect(isPrismaRawUniqueViolation(error)).toBe(false);
  });

  it("returns false when original postgres code is not 23505", () => {
    const error = makeKnownRequestError({
      code: "P2010",
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: "22001",
          },
        },
      },
    });

    expect(isPrismaRawUniqueViolation(error)).toBe(false);
  });

  it("returns false when raw meta shape is missing", () => {
    const error = makeKnownRequestError({ code: "P2010", meta: {} });
    expect(isPrismaRawUniqueViolation(error)).toBe(false);
  });
});
