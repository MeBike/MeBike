import type { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  StationAgencyAlreadyAssigned,
  StationAgencyForbidden,
  StationAgencyNotFound,
  StationAgencyRequired,
  StationCapacityBelowActiveUsage,
  StationCapacityLimitExceeded,
  StationCapacitySplitInvalid,
  StationLocationAlreadyExists,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
  StationReturnSlotLimitBelowActiveReservations,
} from "../errors";
import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationContextRow,
  StationFilter,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";

export type StationCommandService = {
  /**
   * EN: Creates a station after validating capacity, ownership, and geo boundary rules.
   * VI: Tạo trạm mới sau khi validate sức chứa, ownership và geo boundary rules.
   *
   * @param input EN: Station creation payload. VI: Dữ liệu tạo trạm.
   * @returns EN: Created station on success. VI: Trạm vừa tạo nếu hợp lệ.
   */
  createStation: (
    input: CreateStationInput,
  ) => Effect.Effect<
    StationRow,
    | StationNameAlreadyExists
    | StationLocationAlreadyExists
    | StationOutsideSupportedArea
    | StationCapacityLimitExceeded
    | StationCapacitySplitInvalid
    | StationAgencyRequired
    | StationAgencyForbidden
    | StationAgencyNotFound
    | StationAgencyAlreadyAssigned
  >;

  /**
   * EN: Updates an existing station while protecting active operational invariants.
   * VI: Cập nhật trạm hiện có và bảo vệ các invariant vận hành đang tồn tại.
   *
   * @param id EN: Station identifier. VI: ID trạm cần cập nhật.
   * @param input EN: Partial station update payload. VI: Dữ liệu cập nhật.
   * @returns EN: Updated station on success. VI: Trạm sau cập nhật nếu thành công.
   */
  updateStation: (
    id: string,
    input: UpdateStationInput,
  ) => Effect.Effect<
    StationRow,
    | import("../errors").StationNotFound
    | StationNameAlreadyExists
    | StationLocationAlreadyExists
    | StationOutsideSupportedArea
    | StationCapacityLimitExceeded
    | StationCapacitySplitInvalid
    | StationCapacityBelowActiveUsage
    | StationReturnSlotLimitBelowActiveReservations
    | StationAgencyRequired
    | StationAgencyForbidden
    | StationAgencyNotFound
    | StationAgencyAlreadyAssigned
  >;
};

export type StationQueryService = {
  /**
   * EN: Lists stations using standard filters and offset pagination.
   * VI: Liệt kê trạm theo filter chuẩn và phân trang offset.
   *
   * @param filter EN: Station filtering options. VI: Điều kiện lọc trạm.
   * @param pageReq EN: Pagination and sorting configuration. VI: Cấu hình phân trang và sort.
   * @returns EN: Paginated station result. VI: Danh sách trạm có pagination.
   */
  listStations: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>>;

  /**
   * EN: Loads a single station by identifier.
   * VI: Lấy chi tiết một trạm theo ID.
   *
   * @param id EN: Station identifier. VI: ID trạm cần lấy.
   * @returns EN: Station row or `StationNotFound`. VI: Trạm nếu tìm thấy hoặc lỗi `StationNotFound`.
   */
  getStationById: (id: string) => Effect.Effect<StationRow, import("../errors").StationNotFound>;

  listContextExcludingId: (
    excludedId: string,
  ) => Effect.Effect<readonly StationContextRow[]>;

  /**
   * EN: Lists nearest stations for the given coordinates.
   * VI: Tìm các trạm gần nhất theo tọa độ hiện tại.
   *
   * @param args EN: Coordinates, search radius, and pagination input.
   * VI: Tọa độ, bán kính và cấu hình phân trang tìm kiếm.
   * @returns EN: Paginated nearest-station result. VI: Danh sách trạm gần nhất có pagination.
   */
  listNearestStations: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;

};

export type StationService = StationCommandService & StationQueryService;
