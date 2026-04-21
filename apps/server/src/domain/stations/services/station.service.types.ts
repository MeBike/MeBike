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
  StationRevenueGroupBy,
  StationRevenueStats,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";

export type StationCommandService = {
  /**
   * Tao tram moi sau khi validate suc chua, ownership va geo boundary.
   *
   * @param input Du lieu tao tram.
   * @returns Effect tra ve tram vua tao neu hop le.
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
   * Cap nhat tram hien co va bao ve cac invariant van hanh dang ton tai.
   *
   * @param id ID tram can cap nhat.
   * @param input Du lieu cap nhat.
   * @returns Effect tra ve tram sau cap nhat neu thanh cong.
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
   * Liet ke tram theo filter va phan trang offset.
   *
   * @param filter Dieu kien loc tram.
   * @param pageReq Cau hinh phan trang va sort.
   * @returns Effect tra ve danh sach tram co pagination.
   */
  listStations: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>>;

  /**
   * Lay chi tiet mot tram theo ID.
   *
   * @param id ID tram can lay.
   * @returns Effect tra ve tram neu tim thay.
   */
  getStationById: (id: string) => Effect.Effect<StationRow, import("../errors").StationNotFound>;

  listContextExcludingId: (
    excludedId: string,
  ) => Effect.Effect<readonly StationContextRow[]>;

  /**
   * Tim tram gan nhat theo vi tri hien tai.
   *
   * @param args Toa do, ban kinh va pagination tim kiem.
   * @returns Effect tra ve danh sach tram gan nhat.
   */
  listNearestStations: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;

  /**
   * Tong hop doanh thu theo tram trong mot khoang thoi gian.
   * Doanh thu duoc ghi nhan theo endTime cua rental hoan tat,
   * nhung van gan ownership cho startStationId.
   *
   * @param args Moc thoi gian bat dau va ket thuc.
   * @returns Effect tra ve tong hop doanh thu + xep hang tram.
   */
  getRevenueByStation: (args: {
    from: Date;
    to: Date;
    groupBy?: StationRevenueGroupBy;
  }) => Effect.Effect<StationRevenueStats>;

  /**
   * Tong hop doanh thu cho mot tram cu the trong khoang thoi gian.
   * Revenue recognition dung endTime, station ownership dung startStationId.
   *
   * @param args Tram dich va moc thoi gian bat dau / ket thuc.
   * @returns Effect tra ve stats cua tram hoac StationNotFound.
   */
  getRevenueForStation: (args: {
    stationId: string;
    from: Date;
    to: Date;
    groupBy?: StationRevenueGroupBy;
  }) => Effect.Effect<StationRevenueStats, import("../errors").StationNotFound>;
};

export type StationService = StationCommandService & StationQueryService;
