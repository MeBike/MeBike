import { Effect, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type {
  CreateReturnConfirmationInput,
  RentalReturnConfirmationWriteRepo,
} from "./rental.return-confirmation-write.repository.types";

import {
  RentalRepositoryError,
  ReturnConfirmationUniqueViolation,
} from "../../domain-errors";
import {
  mapToReturnConfirmationRow,
  returnConfirmationSelect,
} from "../rental.return-confirmation.repository.query";
import { uniqueTargets } from "../unique-violation";

/**
 * Tạo write repository cho return confirmation bằng Prisma client hiện tại.
 *
 * Hàm này nhận cả `PrismaClient` và `TransactionClient`, giống các factory write
 * khác. Trong flow xác nhận trả xe, caller truyền transaction client để việc đọc
 * confirmation, tạo confirmation, đóng slot, cập nhật bike và hoàn tất rental nằm
 * trong cùng một transaction.
 *
 * Khác với `rental.rental-write.repository.ts`, factory này không cập nhật
 * lifecycle chính của rental. Nó chỉ quản lý dấu mốc operator đã xác nhận xe được
 * bàn giao lại tại station nào.
 *
 * Không compose slice này vào `makeRentalWriteRepository(...)`, vì làm vậy sẽ mở
 * rộng normal `RentalRepo` façade bằng một operation chỉ phục vụ confirm-return.
 * Caller cần operation này nên import factory trực tiếp và truyền transaction
 * client vào, giống các command-specific repository factories khác.
 *
 * @param client Prisma client hoặc transaction client dùng cho thao tác ghi.
 */
export function makeRentalReturnConfirmationWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalReturnConfirmationWriteRepo {
  return {
    /**
     * Đọc confirmation hiện có của rental trước khi tạo bản ghi mới.
     *
     * Dùng trong return-confirm flow để trả lỗi domain `ReturnAlreadyConfirmed`
     * sớm, thay vì chỉ dựa vào unique constraint ở bước create.
     *
     * @param rentalId ID rental cần kiểm tra confirmation.
     */
    findReturnConfirmationByRentalId(rentalId) {
      return Effect.tryPromise({
        try: () =>
          client.returnConfirmation.findUnique({
            where: { rentalId },
            select: returnConfirmationSelect,
          }),
        catch: cause =>
          new RentalRepositoryError({
            operation: "returnConfirmation.findByRentalId",
            cause,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToReturnConfirmationRow)),
        ),
        defectOn(RentalRepositoryError),
      );
    },

    /**
     * Tạo confirmation khi operator xác nhận đã nhận xe trả lại.
     *
     * Unique violation được map sang `ReturnConfirmationUniqueViolation`; service
     * layer tiếp tục chuyển thành `ReturnAlreadyConfirmed`. Nhờ vậy repository chỉ
     * nói về lỗi persistence, còn business wording nằm ở service layer.
     *
     * @param input Dữ liệu confirmation được sinh từ flow xác nhận trả xe.
     */
    createReturnConfirmation(input: CreateReturnConfirmationInput) {
      return Effect.tryPromise({
        try: () =>
          client.returnConfirmation.create({
            data: {
              rentalId: input.rentalId,
              stationId: input.stationId,
              confirmedByUserId: input.confirmedByUserId,
              confirmationMethod: input.confirmationMethod,
              handoverStatus: input.handoverStatus,
              confirmedAt: input.confirmedAt,
            },
            select: returnConfirmationSelect,
          }),
        catch: cause =>
          Match.value(cause).pipe(
            Match.when(
              isPrismaUniqueViolation,
              error =>
                new ReturnConfirmationUniqueViolation({
                  operation: "returnConfirmation.create",
                  constraint: uniqueTargets(error),
                  cause: error,
                }),
            ),
            Match.orElse(
              error =>
                new RentalRepositoryError({
                  operation: "returnConfirmation.create",
                  cause: error,
                }),
            ),
          ),
      }).pipe(
        Effect.map(mapToReturnConfirmationRow),
        defectOn(RentalRepositoryError),
      );
    },
  };
}
