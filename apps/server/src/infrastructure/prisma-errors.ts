import { Prisma as PrismaTypes } from "generated/prisma/client";

export function isPrismaUniqueViolation(
  error: unknown,
): error is PrismaTypes.PrismaClientKnownRequestError & { code: "P2002" } {
  return (
    error instanceof PrismaTypes.PrismaClientKnownRequestError
    && error.code === "P2002"
  );
}
