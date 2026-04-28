import type { Effect, Option } from "effect";

import type {
  ConfirmationMethod,
  HandoverStatus,
} from "generated/prisma/client";

import type { ReturnConfirmationRepoError } from "../../domain-errors";
import type { ReturnConfirmationRow } from "../../models";

/**
 * Input ghi nhận operator đã xác nhận xe được trả lại.
 *
 * Đây là command-side data cho flow confirm-return, không phải DTO HTTP. Controller
 * và service đã xử lý auth/role/station trước khi dữ liệu tới repository.
 */
export type CreateReturnConfirmationInput = {
  /** Rental được xác nhận trả xe. */
  rentalId: string;

  /** Station thực tế nhận xe trả lại. */
  stationId: string;

  /** User operator thực hiện xác nhận. */
  confirmedByUserId: string;

  /** Cách xác nhận bàn giao, ví dụ staff scan hoặc thao tác thủ công. */
  confirmationMethod: ConfirmationMethod;

  /** Trạng thái bàn giao được ghi nhận tại thời điểm xác nhận. */
  handoverStatus: HandoverStatus;

  /** Thời điểm nghiệp vụ của xác nhận trả xe. */
  confirmedAt: Date;
};

/**
 * Contract write-side hẹp cho return confirmation.
 *
 * Contract này cố ý không nằm trong `RentalRepo`. Return confirmation hiện chỉ là
 * persistence helper của command confirm-return, không phải surface chung cho
 * rental repository. Khi cần dùng, command tạo factory trực tiếp bằng transaction
 * client để giữ phạm vi phụ thuộc nhỏ và rõ.
 */
export type RentalReturnConfirmationWriteRepo = {
  /**
   * Đọc confirmation đã tồn tại của rental.
   *
   * @param rentalId ID rental cần kiểm tra confirmation.
   */
  findReturnConfirmationByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<ReturnConfirmationRow>>;

  /**
   * Tạo return confirmation cho rental đang hoàn tất trả xe.
   *
   * @param input Dữ liệu confirmation được sinh trong confirm-return command.
   */
  createReturnConfirmation: (
    input: CreateReturnConfirmationInput,
  ) => Effect.Effect<ReturnConfirmationRow, ReturnConfirmationRepoError>;
};
