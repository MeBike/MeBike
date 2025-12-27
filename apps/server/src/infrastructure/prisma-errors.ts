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
