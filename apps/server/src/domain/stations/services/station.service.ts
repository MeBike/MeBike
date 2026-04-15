import { Effect, Layer, Option } from "effect";

import type { AgencyRepo } from "@/domain/agencies";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { env } from "@/config/env";
import { AgencyRepository, AgencyRepositoryError } from "@/domain/agencies";
import { defectOn } from "@/domain/shared";

import type {
  StationAgencyAlreadyAssigned,
  StationAgencyForbidden,
  StationAgencyNotFound,
  StationAgencyRequired,
  StationCapacityBelowActiveUsage,
  StationCapacityLimitExceeded,
  StationCapacitySplitInvalid,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
  StationReturnSlotLimitBelowActiveReservations,
} from "../errors";
import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationFilter,
  StationRevenueStats,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";
import type { StationRepo } from "../repository/station.repository";

import {
  StationAgencyAlreadyAssigned as StationAgencyAlreadyAssignedError,
  StationAgencyForbidden as StationAgencyForbiddenError,
  StationAgencyNotFound as StationAgencyNotFoundError,
  StationAgencyRequired as StationAgencyRequiredError,
  StationCapacityBelowActiveUsage as StationCapacityBelowActiveUsageError,
  StationCapacityLimitExceeded as StationCapacityLimitExceededError,
  StationCapacitySplitInvalid as StationCapacitySplitInvalidError,
  StationNotFound,
  StationReturnSlotLimitBelowActiveReservations as StationReturnSlotLimitBelowActiveReservationsError,
} from "../errors";
import { StationRepository } from "../repository/station.repository";

export type StationService = {
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
    | StationNotFound
    | StationNameAlreadyExists
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
  getStationById: (id: string) => Effect.Effect<StationRow, StationNotFound>;

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
   *
   * @param args Moc thoi gian bat dau va ket thuc.
   * @returns Effect tra ve tong hop doanh thu + xep hang tram.
   */
  getRevenueByStation: (args: {
    from: Date;
    to: Date;
  }) => Effect.Effect<StationRevenueStats>;
};

/**
 * Ghep business rule cho station domain tren top cua StationRepo.
 *
 * @param repo Repository thao tac du lieu tram.
 * @param deps Phu thuoc domain khac can de validate ownership.
 * @param deps.agencyRepo Repository agency can de validate ownership.
 * @param deps.reservationRepo Cho de tuong thich voi caller cu, hien khong con duoc su dung.
 * @returns StationService da bao gom validate va orchestration.
 */
export function makeStationService(repo: StationRepo, deps: {
  agencyRepo: Pick<AgencyRepo, "getById">;
  reservationRepo?: unknown;
}): StationService {
  /**
   * Chuan hoa capacity split khi tao tram moi.
   *
   * @param input Input tao tram chua chac da co returnSlotLimit.
   * @param input.totalCapacity Tong suc chua cua tram moi.
   * @param input.returnSlotLimit Gioi han slot tra xe neu caller co truyen vao.
   * @returns Cap total/return slot da duoc fill default.
   */
  function resolveCapacitySplit(input: {
    totalCapacity: number;
    returnSlotLimit?: number;
  }) {
    return {
      totalCapacity: input.totalCapacity,
      returnSlotLimit: input.returnSlotLimit ?? input.totalCapacity,
    };
  }

  /**
   * Chuan hoa capacity split khi cap nhat de giu hanh vi default on dinh.
   *
   * @param current Tram hien tai trong DB.
   * @param input Payload cap nhat.
   * @returns Cap total/return slot sau khi merge voi gia tri cu.
   */
  function resolveUpdatedCapacitySplit(current: StationRow, input: UpdateStationInput) {
    const totalCapacity = input.totalCapacity ?? current.totalCapacity;

    const returnSlotLimit = input.returnSlotLimit
      ?? (input.totalCapacity != null && current.returnSlotLimit === current.totalCapacity
        ? input.totalCapacity
        : current.returnSlotLimit);

    return {
      totalCapacity,
      returnSlotLimit,
    };
  }

  /**
   * Validate return slot limit co nam trong khoang hop le cua total capacity hay khong.
   *
   * @param args Cap total/return slot can kiem tra.
   * @param args.totalCapacity Tong suc chua can doi chieu.
   * @param args.returnSlotLimit Gioi han slot tra xe can validate.
   * @returns `true` neu split hop le.
   */
  function validateCapacitySplit(args: {
    totalCapacity: number;
    returnSlotLimit: number;
  }) {
    return args.totalCapacity > 0
      && args.returnSlotLimit >= 0
      && args.returnSlotLimit <= args.totalCapacity;
  }

  /**
   * Validate quan he giua station type va agency ownership.
   *
   * @param args Loai tram, agency va station dang bi exclude khi update.
   * @param args.stationType Loai tram sau khi merge input.
   * @param args.agencyId Agency duoc gan cho tram.
   * @param args.excludeStationId Station can bo qua khi dang update chinh no.
   * @returns Effect chi thanh cong khi ownership hop le va agency ton tai.
   */
  const validateOwnership = (args: {
    stationType: CreateStationInput["stationType"];
    agencyId: string | null | undefined;
    excludeStationId?: string;
  }) =>
    Effect.gen(function* () {
      const stationType = args.stationType ?? "INTERNAL";
      const agencyId = args.agencyId ?? null;

      if (stationType === "AGENCY" && !agencyId) {
        return yield* Effect.fail(new StationAgencyRequiredError({}));
      }

      if (stationType === "INTERNAL" && agencyId) {
        return yield* Effect.fail(new StationAgencyForbiddenError({}));
      }

      if (!agencyId) {
        return;
      }

      const agency = yield* deps.agencyRepo.getById(agencyId).pipe(
        defectOn(AgencyRepositoryError),
      );

      if (Option.isNone(agency)) {
        return yield* Effect.fail(new StationAgencyNotFoundError({
          agencyId,
        }));
      }

      const existingStation = yield* repo.getByAgencyId(agencyId);
      if (
        Option.isSome(existingStation)
        && existingStation.value.id !== args.excludeStationId
      ) {
        return yield* Effect.fail(new StationAgencyAlreadyAssignedError({
          agencyId,
          stationId: existingStation.value.id,
        }));
      }
    });

  /**
   * Chan cac cap nhat lam vi pham tai nguyen dang duoc su dung.
   *
   * @param current Trang thai tram hien tai.
   * @param next Gia tri suc chua moi sau khi merge update.
   * @param next.totalCapacity Tong suc chua sau cap nhat.
   * @param next.returnSlotLimit Gioi han slot tra xe sau cap nhat.
   * @returns Effect fail neu cap nhat lam vuot qua bike/return-slot dang active.
   */
  const validateOperationalUpdate = (current: StationRow, next: {
    totalCapacity: number;
    returnSlotLimit: number;
  }) =>
    Effect.gen(function* () {
      if (
        next.totalCapacity !== current.totalCapacity
        && next.totalCapacity < current.totalBikes + current.activeReturnSlots
      ) {
        return yield* Effect.fail(new StationCapacityBelowActiveUsageError({
          stationId: current.id,
          totalCapacity: next.totalCapacity,
          totalBikes: current.totalBikes,
          activeReturnSlots: current.activeReturnSlots,
        }));
      }

      if (
        next.returnSlotLimit !== current.returnSlotLimit
        && next.returnSlotLimit < current.activeReturnSlots
      ) {
        return yield* Effect.fail(new StationReturnSlotLimitBelowActiveReservationsError({
          stationId: current.id,
          returnSlotLimit: next.returnSlotLimit,
          activeReturnSlots: current.activeReturnSlots,
        }));
      }
    });

  return {
    createStation: input =>
      Effect.gen(function* () {
        if (input.totalCapacity > env.STATION_CAPACITY_LIMIT) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            totalCapacity: input.totalCapacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }

        const split = resolveCapacitySplit(input);
        if (!validateCapacitySplit(split)) {
          return yield* Effect.fail(new StationCapacitySplitInvalidError(split));
        }

        yield* validateOwnership({
          stationType: input.stationType,
          agencyId: input.agencyId,
        });

        return yield* repo.create(input);
      }),
    updateStation: (id, input) =>
      Effect.gen(function* () {
        const currentOpt = yield* repo.getById(id);
        if (Option.isNone(currentOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }

        const current = currentOpt.value;
        const nextCapacity = input.totalCapacity ?? current.totalCapacity;
        if (
          nextCapacity > env.STATION_CAPACITY_LIMIT
        ) {
          return yield* Effect.fail(new StationCapacityLimitExceededError({
            totalCapacity: nextCapacity,
            maxCapacity: env.STATION_CAPACITY_LIMIT,
          }));
        }

        const split = resolveUpdatedCapacitySplit(current, input);
        if (!validateCapacitySplit(split)) {
          return yield* Effect.fail(new StationCapacitySplitInvalidError(split));
        }

        yield* validateOperationalUpdate(current, split);

        const nextStationType = input.stationType ?? current.stationType;
        const nextAgencyId = input.agencyId === undefined ? current.agencyId : input.agencyId;

        yield* validateOwnership({
          stationType: nextStationType,
          agencyId: nextAgencyId,
          excludeStationId: current.id,
        });

        const updatedOpt = yield* repo.update(id, input);
        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return updatedOpt.value;
      }),
    listStations: (filter, page) =>
      repo.listWithOffset(filter, page),
    getStationById: id =>
      Effect.gen(function* () {
        const maybe = yield* repo.getById(id);
        if (Option.isNone(maybe)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return maybe.value;
      }),
    listNearestStations: args =>
      repo.listNearest(args),
    getRevenueByStation: args =>
      Effect.gen(function* () {
        const rows = yield* repo.getRevenueByStation(args);
        const stations = [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const totalRevenue = stations.reduce((sum, station) => sum + station.totalRevenue, 0);
        const totalRentals = stations.reduce((sum, station) => sum + station.totalRentals, 0);

        return {
          period: args,
          summary: {
            totalStations: stations.length,
            totalRevenue,
            totalRentals,
            avgRevenuePerStation: stations.length === 0
              ? 0
              : Number((totalRevenue / stations.length).toFixed(2)),
          },
          stations,
        } satisfies StationRevenueStats;
      }),
  };
}

const makeStationServiceEffect = Effect.gen(function* () {
  const repo = yield* StationRepository;
  const agencyRepo = yield* AgencyRepository;
  return makeStationService(repo, { agencyRepo });
});

export class StationServiceTag extends Effect.Service<StationServiceTag>()(
  "StationService",
  {
    effect: makeStationServiceEffect,
  },
) {}

export const StationServiceLive = Layer.effect(
  StationServiceTag,
  makeStationServiceEffect.pipe(Effect.map(StationServiceTag.make)),
);
