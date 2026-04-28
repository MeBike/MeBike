import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RentalRepo } from "../rental.repository.types";

import { makeRentalRentalWriteRepository } from "./rental.rental-write.repository";

/**
 * Command-side persistence surface cho lifecycle chính của rental.
 *
 * File này chỉ compose các write-slice thuộc contract `RentalRepo` hiện tại.
 * Những persistence helper chỉ phục vụ một command hẹp, ví dụ return confirmation
 * của flow confirm-return, không nên được thêm vào đây nếu không muốn mở rộng
 * normal rental repo façade.
 *
 * Nếu thêm write operation mới cho rental lifecycle dùng lại rộng rãi, tạo một
 * file `write/<scope>.ts` rồi compose tại đây. Nếu operation chỉ là chi tiết nội
 * bộ của một command, import factory đó trực tiếp ở command service/guard.
 */
export type RentalWriteRepo = Pick<
  RentalRepo,
  | "createRental"
  | "updateRentalDepositHold"
  | "updateRentalOnEnd"
  | "markOverdueUnreturned"
>;

/**
 * Tạo toàn bộ write surface cho rental bằng cùng Prisma client/transaction.
 *
 * Không thêm implementation trực tiếp vào `rental.repository.ts` trừ khi đó chỉ là
 * glue tạm thời cho legacy code.
 *
 * @param client Prisma client hoặc transaction client dùng chung cho các slice.
 */
export function makeRentalWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalWriteRepo {
  return {
    ...makeRentalRentalWriteRepository(client),
  };
}
