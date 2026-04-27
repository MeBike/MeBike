import type { Effect, Option } from "effect";

import type { ReturnSlotStatus } from "generated/prisma/client";

import type { ReturnSlotRepoError } from "../domain-errors";
import type {
  ReturnSlotRow,
  ReturnSlotStationCapacityRow,
} from "../models";

export type CreateActiveReturnSlotInput = {
  rentalId: string;
  userId: string;
  stationId: string;
  reservedFrom: Date;
};

/**
 * Contract persistence cho return-slot reservation.
 *
 * Phân biệt quan trọng:
 * - `findActiveByRentalId`: chỉ nhìn trạng thái DB `ACTIVE`.
 * - `findUnexpiredActiveByRentalId`: chỉ trả slot còn hiệu lực theo cutoff do
 *   caller truyền vào.
 */
export type ReturnSlotRepo = {
  /**
   * Đọc slot ACTIVE hiện tại của một rental theo trạng thái DB.
   *
   * @param rentalId ID rental cần đọc slot.
   */
  findActiveByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>>;

  /**
   * Đọc slot ACTIVE còn nằm trong cửa sổ giữ chỗ hợp lệ.
   *
   * @param rentalId ID rental cần đọc slot.
   * @param activeAfter Mốc cutoff. Slot có `reservedFrom` lớn hơn mốc này mới
   * được coi là còn hiệu lực.
   */
  findUnexpiredActiveByRentalId: (
    rentalId: string,
    activeAfter: Date,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>>;

  /**
   * Tạo slot ACTIVE mới cho rental.
   *
   * @param input Dữ liệu rental, user, station và thời điểm bắt đầu giữ chỗ.
   */
  createActive: (
    input: CreateActiveReturnSlotInput,
  ) => Effect.Effect<ReturnSlotRow, ReturnSlotRepoError>;

  /**
   * Hủy các slot ACTIVE đã hết hạn của đúng một rental.
   *
   * Dùng ở request path để correctness không phụ thuộc vào cron worker.
   *
   * @param rentalId ID rental cần cleanup.
   * @param activeUntil Mốc cutoff. Slot có `reservedFrom` nhỏ hơn hoặc bằng mốc
   * này sẽ bị hủy.
   * @param updatedAt Thời điểm ghi nhận thao tác cleanup.
   */
  cancelActiveByRentalIdOlderThan: (
    rentalId: string,
    activeUntil: Date,
    updatedAt: Date,
  ) => Effect.Effect<number>;

  /**
   * Hủy slot ACTIVE hiện tại của một rental, bất kể còn hạn hay không.
   *
   * @param rentalId ID rental đang giữ slot.
   * @param updatedAt Thời điểm ghi nhận thao tác hủy.
   */
  cancelActiveByRentalId: (
    rentalId: string,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>>;

  /**
   * Batch cleanup cho worker: hủy mọi slot ACTIVE đã quá hạn.
   *
   * @param activeUntil Mốc cutoff. Slot có `reservedFrom` nhỏ hơn hoặc bằng mốc
   * này sẽ bị hủy.
   * @param updatedAt Thời điểm ghi nhận thao tác cleanup.
   */
  cancelActiveOlderThan: (
    activeUntil: Date,
    updatedAt: Date,
  ) => Effect.Effect<number>;

  /**
   * Batch cleanup cho worker và trả lại các slot vừa bị hủy.
   *
   * Dùng khi caller cần phát realtime event cho từng user sau cleanup.
   *
   * @param activeUntil Mốc cutoff. Slot có `reservedFrom` nhỏ hơn hoặc bằng mốc
   * này sẽ bị hủy.
   * @param updatedAt Thời điểm ghi nhận thao tác cleanup.
   */
  cancelActiveOlderThanReturning: (
    activeUntil: Date,
    updatedAt: Date,
  ) => Effect.Effect<readonly ReturnSlotRow[]>;

  /**
   * Chốt slot ACTIVE hiện tại của rental sang trạng thái cuối cùng.
   *
   * @param rentalId ID rental đang giữ slot.
   * @param status Trạng thái cuối cùng cần ghi nhận (`USED` hoặc `CANCELLED`).
   * @param updatedAt Thời điểm chốt trạng thái.
   */
  finalizeActiveByRentalId: (
    rentalId: string,
    status: Extract<ReturnSlotStatus, "USED" | "CANCELLED">,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>>;

  /**
   * Đọc snapshot capacity cho flow giữ chỗ trả xe.
   *
   * Khi có `activeAfter`, chỉ các slot ACTIVE còn hiệu lực mới được tính vào
   * `activeReturnSlots`.
   *
   * @param stationId ID station cần đọc snapshot.
   * @param activeAfter Mốc cutoff tùy chọn để loại các slot ACTIVE đã quá hạn.
   */
  getStationCapacitySnapshot: (
    stationId: string,
    activeAfter?: Date,
  ) => Effect.Effect<Option.Option<ReturnSlotStationCapacityRow>>;
};
