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
