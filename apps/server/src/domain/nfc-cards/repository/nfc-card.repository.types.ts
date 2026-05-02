import type { Effect, Option } from "effect";

import type {
  DuplicateNfcCardUid,
  NfcCardAlreadyAssigned,
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
 * Cổng truy vấn dữ liệu thẻ NFC đã được map sang row domain.
 *
 * Layer service phía trên dùng interface này để đọc trạng thái thẻ hiện tại,
 * người đang được gán, hoặc tìm thẻ theo UID do thiết bị gửi lên.
 */
export type NfcCardReadRepo = {
  /**
   * Tìm một thẻ theo id nội bộ.
   */
  readonly findById: (id: string) => Effect.Effect<Option.Option<NfcCardRow>>;

  /**
   * Tìm một thẻ theo UID vật lý được firmware phát ra khi quẹt thẻ.
   */
  readonly findByUid: (uid: string) => Effect.Effect<Option.Option<NfcCardRow>>;

  /**
   * Tìm thẻ hiện đang được gán cho một user cụ thể.
   */
  readonly findByAssignedUserId: (userId: string) => Effect.Effect<Option.Option<NfcCardRow>>;

  /**
   * Liệt kê thẻ theo bộ lọc quản trị.
   *
   * @param filter Bộ lọc theo trạng thái, user đang được gán, hoặc một phần UID.
   */
  readonly list: (filter: NfcCardFilter) => Effect.Effect<readonly NfcCardRow[]>;
};

/**
 * Cổng ghi dữ liệu cho vòng đời thẻ NFC.
 *
 * Các hàm ở đây chỉ lo persist trạng thái cuối cùng và bảo vệ bất biến ở mức
 * transaction/unique constraint; rule nghiệp vụ đầy đủ nằm ở command service.
 */
export type NfcCardWriteRepo = {
  /**
   * Tạo mới một bản ghi thẻ trong kho từ UID vật lý.
   *
   * @param input Dữ liệu tạo thẻ, hiện tại chỉ cần UID vật lý của thẻ.
   */
  readonly create: (input: CreateNfcCardInput) => Effect.Effect<NfcCardRow, DuplicateNfcCardUid>;

  /**
   * Gán thẻ cho user và đưa thẻ sang trạng thái hoạt động.
   *
   * @param input Gồm id thẻ, id user đích, và mốc thời gian dùng cho issuedAt.
   */
  readonly assignToUser: (
    input: AssignNfcCardInput,
  ) => Effect.Effect<NfcCardRow, NfcCardAlreadyAssigned | UserAlreadyHasNfcCard>;

  /**
   * Trả thẻ về kho và xóa người đang được gán.
   *
   * @param args Gồm id thẻ cần thu hồi và thời điểm trả về kho.
   */
  readonly unassign: (args: {
    readonly nfcCardId: string;
    readonly now: Date;
  }) => Effect.Effect<NfcCardRow>;

  /**
   * Cập nhật trạng thái vận hành của thẻ đang tồn tại.
   *
   * @param input Gồm id thẻ, trạng thái đích, và thời điểm áp dụng chuyển trạng thái.
   */
  readonly updateStatus: (
    input: UpdateNfcCardStatusInput,
  ) => Effect.Effect<NfcCardRow>;
};
