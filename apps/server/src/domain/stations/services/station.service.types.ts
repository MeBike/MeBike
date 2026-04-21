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
   * Tạo trạm mới sau khi validate sức chứa, ownership và geo boundary rules.
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
   * Cập nhật trạm hiện có và bảo vệ các invariant vận hành đang tồn tại.
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
   * Liệt kê trạm theo filter chuẩn và phân trang offset.
   */
  listStations: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>>;

  /**
   * Lấy chi tiết một trạm theo ID.
   */
  getStationById: (id: string) => Effect.Effect<StationRow, import("../errors").StationNotFound>;

  listContextExcludingId: (
    excludedId: string,
  ) => Effect.Effect<readonly StationContextRow[]>;

  /**
   * Tìm các trạm gần nhất theo tọa độ hiện tại.
   */
  listNearestStations: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;

};

export type StationService = StationCommandService & StationQueryService;
