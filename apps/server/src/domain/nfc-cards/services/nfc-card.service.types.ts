import type { Effect, Option } from "effect";

import type {
  DuplicateNfcCardUid,
  NfcCardAlreadyAssigned,
  NfcCardAssigneeNotFound,
  NfcCardInvalidState,
  NfcCardNotFound,
  NfcCardUserNotEligible,
  UserAlreadyHasNfcCard,
} from "../domain-errors";
import type {
  AssignNfcCardInput,
  CreateNfcCardInput,
  NfcCardFilter,
  NfcCardRow,
  UpdateNfcCardStatusInput,
} from "../models";

/**
 * Nhóm use-case đọc cho domain thẻ NFC.
 *
 * Phía HTTP admin và IoT tap flow dùng service này để tra cứu thẻ theo id,
 * UID vật lý, hoặc theo user đang được gán.
 */
export type NfcCardQueryService = {
  /**
   * Lấy thẻ theo id nội bộ.
   */
  readonly getById: (id: string) => Effect.Effect<Option.Option<NfcCardRow>>;

  /**
   * Lấy thẻ theo UID vật lý do firmware gửi lên.
   */
  readonly findByUid: (uid: string) => Effect.Effect<Option.Option<NfcCardRow>>;

  /**
   * Lấy thẻ hiện đang được gán cho user.
   */
  readonly findByAssignedUserId: (userId: string) => Effect.Effect<Option.Option<NfcCardRow>>;

  /**
   * Liệt kê thẻ theo bộ lọc quản trị.
   *
   * @param filter Bộ lọc trạng thái, user đang được gán, hoặc UID cần tìm gần đúng.
   */
  readonly list: (filter: NfcCardFilter) => Effect.Effect<readonly NfcCardRow[]>;
};

/**
 * Nhóm use-case ghi cho domain thẻ NFC.
 *
 * Đây là nơi giữ các rule nghiệp vụ chính như điều kiện gán thẻ, chuyển trạng
 * thái, và cách trả thẻ về kho.
 */
export type NfcCardCommandService = {
  /**
   * Tạo mới một thẻ trong kho từ UID vật lý.
   *
   * @param input Dữ liệu tạo thẻ, hiện tại chỉ cần UID của thẻ vật lý.
   */
  readonly createCard: (input: CreateNfcCardInput) => Effect.Effect<NfcCardRow, DuplicateNfcCardUid>;

  /**
   * Gán thẻ cho một user hợp lệ và kích hoạt quyền quẹt thẻ.
   *
   * @param input Gồm id thẻ, id user đích, và mốc thời gian cấp thẻ.
   */
  readonly assignCard: (
    input: AssignNfcCardInput,
  ) => Effect.Effect<
    NfcCardRow,
    | NfcCardAlreadyAssigned
    | NfcCardAssigneeNotFound
    | NfcCardInvalidState
    | NfcCardNotFound
    | NfcCardUserNotEligible
    | UserAlreadyHasNfcCard
  >;

  /**
   * Gỡ gán thẻ hiện tại và trả thẻ về trạng thái tồn kho.
   *
   * @param args Gồm id thẻ cần thu hồi và thời điểm trả thẻ về kho.
   */
  readonly unassignCard: (args: {
    readonly nfcCardId: string;
    readonly now: Date;
  }) => Effect.Effect<NfcCardRow, NfcCardNotFound>;

  /**
   * Đổi trạng thái vận hành của thẻ đang tồn tại.
   *
   * @param input Gồm id thẻ, trạng thái đích, và thời điểm áp dụng chuyển trạng thái.
   */
  readonly updateStatus: (
    input: UpdateNfcCardStatusInput,
  ) => Effect.Effect<
    NfcCardRow,
    NfcCardAssigneeNotFound | NfcCardInvalidState | NfcCardNotFound | NfcCardUserNotEligible
  >;
};
