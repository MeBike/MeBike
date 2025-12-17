import type { Prisma as PrismaTypes } from "../../../../generated/prisma/client";

export function uniqueTargets(error: PrismaTypes.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target
    : typeof target === "string"
      ? [target]
      : [];
}

export function isEmailTarget(target: string): boolean {
  return target.includes("email");
}

export function isPhoneTarget(target: string): boolean {
  return (
    target.includes("phone_number")
    || target.includes("phoneNumber")
    || target.includes("phone_number_key")
  );
}
