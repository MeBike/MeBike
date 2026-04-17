import { describe, expect, it } from "vitest";

import {
  getPrismaRawUniqueViolationConstraint,
  isPrismaRawUniqueViolation,
} from "@/infrastructure/prisma-errors";
import { Prisma as PrismaTypes } from "generated/prisma/client";

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

describe("getPrismaRawUniqueViolationConstraint", () => {
  it("returns direct constraint name when available", () => {
    const error = makeKnownRequestError({
      code: "P2010",
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: "23505",
            constraint: "uq_station_exact_location",
          },
        },
      },
    });

    expect(getPrismaRawUniqueViolationConstraint(error)).toBe("uq_station_exact_location");
  });

  it("extracts constraint name from raw postgres detail text", () => {
    const error = makeKnownRequestError({
      code: "P2010",
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: "23505",
            detail: "duplicate key value violates unique constraint \"uq_station_exact_location\"",
          },
        },
      },
    });

    expect(getPrismaRawUniqueViolationConstraint(error)).toBe("uq_station_exact_location");
  });

  it("returns undefined when raw unique constraint cannot be determined", () => {
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

    expect(getPrismaRawUniqueViolationConstraint(error)).toBeUndefined();
  });
});
