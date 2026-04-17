import { Prisma as PrismaTypes } from "generated/prisma/client";

/**
 * EN: Detects a Prisma unique-constraint violation (P2002).
 * VI: Nhận diện lỗi vi phạm ràng buộc unique của Prisma (P2002).
 */
export function isPrismaUniqueViolation(
  error: unknown,
): error is PrismaTypes.PrismaClientKnownRequestError & { code: "P2002" } {
  return (
    error instanceof PrismaTypes.PrismaClientKnownRequestError
    && error.code === "P2002"
  );
}

/**
 * EN: Extracts the "target" (constraint / fields) from a Prisma unique violation (P2002), when
 * available. Prisma doesn't guarantee a stable shape, so this is best-effort.
 * VI: Trích xuất "target" (constraint / fields) từ lỗi unique (P2002) của Prisma nếu có. Prisma
 * không đảm bảo shape ổn định, nên đây chỉ là best-effort.
 */
export function prismaUniqueViolationTarget(
  error: PrismaTypes.PrismaClientKnownRequestError & { code: "P2002" },
): string | string[] | undefined {
  return typeof error.meta?.target === "string" || Array.isArray(error.meta?.target)
    ? error.meta?.target
    : undefined;
}

/**
 * EN: Convenience wrapper for `prismaUniqueViolationTarget` that accepts unknown.
 * VI: Wrapper tiện dụng cho `prismaUniqueViolationTarget` nhưng nhận `unknown`.
 */
export function getPrismaUniqueViolationTarget(error: unknown): string | string[] | undefined {
  return isPrismaUniqueViolation(error) ? prismaUniqueViolationTarget(error) : undefined;
}

/**
 * EN: Detects a Prisma "record not found" error (P2025), typically thrown by `update/delete` when
 * the target row does not exist.
 * VI: Nhận diện lỗi "không tìm thấy bản ghi" của Prisma (P2025), thường xảy ra khi `update/delete`
 * nhưng bản ghi mục tiêu không tồn tại.
 */
export function isPrismaRecordNotFound(
  error: unknown,
): error is PrismaTypes.PrismaClientKnownRequestError & { code: "P2025" } {
  return (
    error instanceof PrismaTypes.PrismaClientKnownRequestError
    && error.code === "P2025"
  );
}

/**
 * EN: Detects a Prisma foreign key violation (P2003).
 * VI: Nhận diện lỗi vi phạm khóa ngoại của Prisma (P2003).
 */
export function isPrismaForeignKeyViolation(
  error: unknown,
): error is PrismaTypes.PrismaClientKnownRequestError & { code: "P2003" } {
  return (
    error instanceof PrismaTypes.PrismaClientKnownRequestError
    && error.code === "P2003"
  );
}

/**
 * EN: Detects a raw-query unique violation wrapped by Prisma as P2010 with PostgreSQL code 23505.
 * VI: Nhận diện lỗi unique từ raw query, được Prisma bọc thành P2010 với mã PostgreSQL 23505.
 */
export function isPrismaRawUniqueViolation(error: unknown): boolean {
  if (!(error instanceof PrismaTypes.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2010") {
    return false;
  }
  const originalCode = (
    error.meta as { driverAdapterError?: { cause?: { originalCode?: unknown } } } | undefined
  )
    ?.driverAdapterError
    ?.cause
    ?.originalCode;
  return originalCode === "23505";
}

function extractConstraintName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const direct = /constraint\s+"([^"]+)"/i.exec(value)?.[1];
  if (direct) {
    return direct;
  }

  const quoted = /unique constraint\s+"([^"]+)"/i.exec(value)?.[1];
  if (quoted) {
    return quoted;
  }

  return undefined;
}

export function getPrismaRawUniqueViolationConstraint(error: unknown): string | undefined {
  if (!isPrismaRawUniqueViolation(error)) {
    return undefined;
  }

  const rawError = error as PrismaTypes.PrismaClientKnownRequestError & { code: "P2010" };

  const meta = rawError.meta as {
    driverAdapterError?: {
      cause?: {
        constraint?: unknown;
        detail?: unknown;
        message?: unknown;
      };
      message?: unknown;
    };
    database_error?: unknown;
    message?: unknown;
  } | undefined;

  const directConstraint = meta?.driverAdapterError?.cause?.constraint;
  if (typeof directConstraint === "string" && directConstraint.length > 0) {
    return directConstraint;
  }

  const errorMessage = rawError.message;

  return extractConstraintName(meta?.driverAdapterError?.cause?.detail)
    ?? extractConstraintName(meta?.driverAdapterError?.cause?.message)
    ?? extractConstraintName(meta?.driverAdapterError?.message)
    ?? extractConstraintName(meta?.database_error)
    ?? extractConstraintName(meta?.message)
    ?? extractConstraintName(errorMessage);
}
