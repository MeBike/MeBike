import type { Prisma as PrismaTypes } from "generated/prisma/client";

export function uniqueTargets(error: PrismaTypes.PrismaClientKnownRequestError): string[] {
  const meta = error.meta as {
    target?: unknown;
    driverAdapterError?: {
      cause?: {
        constraint?: {
          fields?: unknown;
        };
      };
    };
  } | undefined;

  const target = meta?.target;
  const targets: string[] = [];

  if (Array.isArray(target)) {
    targets.push(...target);
  }
  else if (typeof target === "string") {
    targets.push(target);
  }
  else if (
    target
    && typeof target === "object"
    && Array.isArray((target as { fields?: unknown }).fields)
  ) {
    targets.push(...((target as { fields: string[] }).fields));
  }

  const constraintFields = meta?.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(constraintFields)) {
    targets.push(...constraintFields);
  }
  else if (typeof constraintFields === "string") {
    targets.push(constraintFields);
  }

  return [...new Set(targets)];
}
