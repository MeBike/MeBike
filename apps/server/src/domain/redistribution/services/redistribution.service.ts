import { Effect, Layer, Option } from "effect";

import type { BikeRepository, BikeRepositoryError } from "@/domain/bikes";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { UserRow } from "@/domain/users";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import {
  makeStationQueryRepository,
  StationQueryServiceTag,
} from "@/domain/stations";
import { UserQueryServiceTag } from "@/domain/users";
import { MapboxRouting } from "@/infrastructure/mapbox";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { BikeStatus, RedistributionStatus } from "generated/prisma/client";

import type { RedistributionServiceFailure } from "../domain-errors";
import type {
  AdminRedistributionFilter,
  InStationRedistributionFilter,
  MyInStationRedistributionFilter,
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
  RedistributionSortField,
} from "../models";
import type { RedistributionRepo } from "../repository/redistribution.repository";

import {
  CannotApproveNonPendingRedistribution,
  CannotCancelNonPendingRedistribution,
  CannotConfirmNonTransitedRedistribution,
  CannotRejectNonPendingRedistribution,
  CannotRevertNonTransitOrPartiallyCompletedRedistribution,
  CannotStartTransitionNonApprovedRedistribution,
  ExceededMinBikesAtStation,
  IncompletedRedistributionRequestExists,
  InvalidBikeIdsForRedistributionCompletion,
  NoBikesInRedistributionRequest,
  NotEnoughBikesAtStation,
  NotEnoughEmptySlotsAtTarget,
  RedistributionRequestNotFound,
  StationNotFound,
  UnauthorizedRedistributionAccess,
  UnauthorizedRedistributionApproval,
  UnauthorizedRedistributionCancellation,
  UnauthorizedRedistributionCompletion,
  UnauthorizedRedistributionCreation,
  UnauthorizedRedistributionRejection,
  UnauthorizedRedistributionRevert,
  UnauthorizedStartTransition,
  UserNotFound,
} from "../domain-errors";
import {
  makeRedistributionRepository,
  RedistributionRepository,
} from "../repository/redistribution.repository";

export type RedistributionService = {
  getMyListInStation: (
    userId: string,
    filter: MyInStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure
  >;

  getMyRequestInStation: (args: {
    userId: string;
    requestId: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure
  >;

  getListInStation: (
    userId: string,
    filter: InStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure
  >;

  getRequestInStation: (args: {
    userId: string;
    requestId: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure
  >;

  createRequestTo: (args: {
    requestedByUserId: string;
    sourceStationId: string;
    targetStationId: string;
    requestedQuantity: number;
    reason: string;
  }) => Effect.Effect<
    RedistributionRequestRow,
    RedistributionServiceFailure,
    Prisma | RedistributionRepository | BikeRepository
  >;

  cancel: (args: {
    requestId: string;
    userId: string;
    reason: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | BikeRepositoryError,
    Prisma | RedistributionRepository | BikeRepository
  >;

  startTransition: (args: {
    requestId: string;
    userId: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | BikeRepositoryError,
    Prisma | RedistributionRepository | BikeRepository
  >;

  approve: (args: {
    requestId: string;
    approvedByUserId: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure
  >;

  reject: (args: {
    requestId: string;
    rejectedByUserId: string;
    reason: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | BikeRepositoryError,
    Prisma | RedistributionRepository | BikeRepository
  >;

  confirmCompletion: (args: {
    requestId: string;
    confirmedByUserId: string;
    completedBikeIds: string[];
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | BikeRepositoryError,
    Prisma | RedistributionRepository | BikeRepository
  >;

  revertRemaining: (args: {
    requestId: string;
    userId: string;
    reason: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | BikeRepositoryError,
    Prisma | RedistributionRepository | BikeRepository
  >;

  adminListRequests: (
    filter: AdminRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure
  >;

  adminGetById: (
    requestId: string,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestDetailRow>,
    RedistributionServiceFailure
  >;

  getHistoryForStaff: (
    userId: string,
    filter: MyInStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure
  >;

  getHistoryForManager: (
    userId: string,
    filter: InStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure
  >;

  getHistoryForAgency: (
    userId: string,
    filter: InStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure
  >;
};

const makeRedistributionServiceEffect = Effect.gen(function* () {
  const repo = yield* RedistributionRepository;
  const userService = yield* UserQueryServiceTag;
  const stationService = yield* StationQueryServiceTag;
  const mapbox = yield* MapboxRouting;
  const { client } = yield* Prisma;
  return makeRedistributionService(repo, userService, stationService, client, mapbox);
});

export class RedistributionServiceTag extends Effect.Service<RedistributionServiceTag>()(
  "RedistributionService",
  {
    effect: makeRedistributionServiceEffect,
  },
) {}

function makeRedistributionService(
  repo: RedistributionRepo,
  userService: UserQueryServiceTag,
  stationService: StationQueryServiceTag,
  client: PrismaClient,
  mapbox: MapboxRouting,
): RedistributionService {
  const TERMINAL_STATUSES: RedistributionStatus[] = [
    RedistributionStatus.COMPLETED,
    RedistributionStatus.CANCELLED,
    RedistributionStatus.REJECTED,
    RedistributionStatus.REVERTED,
  ];

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a
      = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculatePriorityScore = (req: any) => {
    const source = req.sourceStation;
    const target = req.targetStation;

    if (!source?.latitude || !target?.latitude || !source?.longitude || !target?.longitude) {
      return Effect.succeed(0);
    }

    const lat1 = Number(source.latitude);
    const lon1 = Number(source.longitude);
    const lat2 = Number(target.latitude);
    const lon2 = Number(target.longitude);

    return mapbox
      .getRoute({
        origin: { latitude: lat1, longitude: lon1 },
        destination: { latitude: lat2, longitude: lon2 },
        profile: "driving",
      })
      .pipe(
        Effect.map((route) => {
          const D = route.distanceMeters;
          const T = route.durationSeconds;
          const Q = req.requestedQuantity;
          return (Q * 1000) - D - (T * 2);
        }),
        Effect.catchAll(() => {
          const D = getHaversineDistance(lat1, lon1, lat2, lon2);
          const T = D / 8.33; // 30 km/h fallback
          const Q = req.requestedQuantity;
          return Effect.succeed((Q * 1000) - D - (T * 2));
        }),
      );
  };

  const prioritizeRequests = <T extends { status: RedistributionStatus; createdAt: Date; priorityScore?: number }>(
    requests: T[],
  ): Effect.Effect<T[], never> => {
    const pending = requests.filter(r => r.status === RedistributionStatus.PENDING_APPROVAL);
    const others = requests.filter(r => r.status !== RedistributionStatus.PENDING_APPROVAL);

    if (pending.length === 0) {
      return Effect.succeed(requests);
    }

    return Effect.all(
      pending.map(req =>
        calculatePriorityScore(req).pipe(
          Effect.map((score) => {
            req.priorityScore = score;
            return req;
          }),
        ),
      ),
    ).pipe(
      Effect.map((prioritizedPending) => {
        // Sort the pending requests by priority:
        prioritizedPending.sort((a, b) => {
          const diffMs = a.createdAt.getTime() - b.createdAt.getTime();
          // If sent more than 5 minutes apart, earliest gets priority
          if (Math.abs(diffMs) > 5 * 60 * 1000) {
            return diffMs;
          }
          // Within 5 minutes, highest score gets priority
          return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        });

        return [...prioritizedPending, ...others];
      }),
    );
  };

  const assertUserExists = (userId: string) =>
    Effect.gen(function* () {
      const userOpt = yield* userService.getById(userId);

      if (Option.isNone(userOpt)) {
        return yield* Effect.fail(new UserNotFound({ userId }));
      }
      return userOpt.value;
    });

  const getUserStationId = (user: UserRow) =>
    user.orgAssignment?.station?.id
    ?? user.orgAssignment?.agency?.stationId
    ?? undefined;

  const getIncompletedRequestAt = (stationId: string) =>
    repo.findWhere({
      sourceStationId: stationId,
      status: { notIn: TERMINAL_STATUSES },
      completedAt: null,
    });

  const toRedistributionWhere = (
    filter: AdminRedistributionFilter,
  ): PrismaTypes.RedistributionRequestWhereInput => {
    const where: PrismaTypes.RedistributionRequestWhereInput = {
      requestedByUserId: filter.requestedByUserId,
      approvedByUserId: filter.approvedByUserId,
      rejectedByUserId: filter.rejectedByUserId,
      sourceStationId: filter.sourceStationId,
      targetStationId: filter.targetStationId,
    };

    if (filter.status) {
      where.status = filter.status;
    }
    else if (filter.statuses && filter.statuses.length > 0) {
      where.status = { in: filter.statuses };
    }

    if (filter.from || filter.to) {
      where.createdAt = {
        gte: filter.from,
        lte: filter.to,
      };
    }

    if (filter.OR) {
      where.OR = filter.OR.map(toRedistributionWhere);
    }

    return where;
  };

  const getHistoryForStation = (
    userId: string,
    filter: InStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) =>
    Effect.gen(function* () {
      const user = yield* assertUserExists(userId);
      const stationId = getUserStationId(user)!;

      return yield* repo.listWithOffset(
        toRedistributionWhere({
          ...filter,
          statuses: filter.statuses ?? TERMINAL_STATUSES,
          OR: [{ sourceStationId: stationId }, { targetStationId: stationId }],
        }),
        page,
      );
    });

  return {
    getMyListInStation: (userId, filter, page) =>
      repo.listWithOffset(
        toRedistributionWhere({
          ...filter,
          requestedByUserId: userId,
        }),
        page,
      ),

    getMyRequestInStation: ({ userId, requestId }) =>
      Effect.gen(function* () {
        const reqOpt = yield* repo.findAndPopulate({
          id: requestId,
        });

        if (Option.isNone(reqOpt)) {
          return yield* Effect.fail(
            new RedistributionRequestNotFound({ requestId }),
          );
        }

        const req = reqOpt.value;

        // Authorization: users can only view their own request
        if (req.requestedByUser.id !== userId) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionAccess({
              requestId,
              userId,
            }),
          );
        }

        return req;
      }),

    getListInStation: (userId, filter, page) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;
        const pageResult = yield* repo.listWithOffset(
          toRedistributionWhere({
            ...filter,
            OR: [
              { sourceStationId: stationId },
              { targetStationId: stationId },
            ],
          }),
          page,
        );

        const prioritizedItems = yield* prioritizeRequests(pageResult.items);

        return {
          ...pageResult,
          items: prioritizedItems,
        };
      }),

    getRequestInStation: ({ userId, requestId }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;
        const reqOpt = yield* repo.findAndPopulate({
          id: requestId,
        });

        if (Option.isNone(reqOpt)) {
          return yield* Effect.fail(
            new RedistributionRequestNotFound({ requestId }),
          );
        }

        // Authorization: users can only view request related to their station
        const req = reqOpt.value;
        const hasAccess
          = req.sourceStation.id === stationId
            || req.targetStation.id === stationId;

        if (!hasAccess) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionAccess({
              requestId,
              userId,
              sourceStationId: req.sourceStation.id,
              targetStationId: req.targetStation.id,
            }),
          );
        }

        if (req.status === RedistributionStatus.PENDING_APPROVAL) {
          const score = yield* calculatePriorityScore(req);
          req.priorityScore = score;
        }

        return req;
      }),

    createRequestTo: args =>
      Effect.gen(function* () {
        const existingReqOpt = yield* getIncompletedRequestAt(
          args.sourceStationId,
        );
        if (Option.isSome(existingReqOpt)) {
          const existingReq = existingReqOpt.value;
          return yield* Effect.fail(
            new IncompletedRedistributionRequestExists({
              requestId: existingReq.id,
              sourceStationId: args.sourceStationId,
              status: existingReq.status,
            }),
          );
        }
        const user = yield* assertUserExists(args.requestedByUserId);
        const workingStationId = getUserStationId(user)!;

        const sourceStation = yield* stationService
          .getStationById(args.sourceStationId)
          .pipe(
            Effect.catchTag("StationNotFound", () =>
              Effect.fail(
                new StationNotFound({ stationId: args.sourceStationId }),
              )),
          );

        // Authorization: user must belong to source station
        if (workingStationId !== sourceStation.id) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionCreation({
              requestedByUserId: args.requestedByUserId,
              sourceStationId: args.sourceStationId,
              workingStationId,
            }),
          );
        }

        // Check if target station has enough empty slot to meet the requested quantity
        const targetStation = yield* stationService
          .getStationById(args.targetStationId)
          .pipe(
            Effect.catchTag("StationNotFound", () =>
              Effect.fail(
                new StationNotFound({ stationId: args.targetStationId }),
              )),
          );

        if (targetStation.availableReturnSlots < args.requestedQuantity) {
          return yield* Effect.fail(
            new NotEnoughEmptySlotsAtTarget({
              targetStationId: args.targetStationId,
              required: args.requestedQuantity,
              available: targetStation.availableReturnSlots,
            }),
          );
        }

        const now = new Date();
        const bikeIds: string[] = [];

        // Transaction
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txBikeRepo = makeBikeRepository(tx);
            const txRedistributionRepo = makeRedistributionRepository(tx);

            // Fetch bikes + check minimum remaining available bikes
            const [totalAvailableCount, targetAvailableCount, pickedBikes] = yield* Effect.all([
              Effect.promise(() =>
                tx.bike.count({
                  where: {
                    stationId: sourceStation.id,
                    status: "AVAILABLE",
                  },
                }),
              ),

              Effect.promise(() =>
                tx.bike.count({
                  where: {
                    stationId: args.targetStationId,
                    status: "AVAILABLE",
                  },
                }),
              ),

              Effect.promise(() =>
                tx.bike.findMany({
                  where: {
                    stationId: sourceStation.id,
                    status: "AVAILABLE",
                  },
                  take: args.requestedQuantity,
                  select: { id: true },
                }),
              ),
            ]);

            const pickedCount = pickedBikes.length;
            if (pickedCount < args.requestedQuantity) {
              return yield* Effect.fail(
                new NotEnoughBikesAtStation({
                  stationId: args.sourceStationId,
                  required: args.requestedQuantity,
                  available: pickedCount,
                }),
              );
            }

            const restBikes = totalAvailableCount - pickedCount;

            const minBikesConfig = yield* Effect.promise(() =>
              tx.systemConfig.findUnique({
                where: { key: "min_available_bikes_at_station" },
              }),
            );
            const parsedVal = minBikesConfig ? Number.parseInt(minBikesConfig.value, 10) : Number.NaN;
            const minAvailableBikesLimit = Number.isNaN(parsedVal) ? 10 : parsedVal;

            if (restBikes < minAvailableBikesLimit) {
              return yield* Effect.fail(
                new ExceededMinBikesAtStation({
                  stationId: args.sourceStationId,
                  minAvailableBikes: minAvailableBikesLimit,
                  availableBikesAfterFulfillment: restBikes,
                }),
              );
            }

            bikeIds.push(...pickedBikes.map(b => b.id));

            // Marks bikes as pending dispatch
            yield* txBikeRepo.updateManyStatusAt(
              bikeIds,
              BikeStatus.PENDING_DISPATCH,
              now,
            );

            return yield* txRedistributionRepo.create({
              ...args,
              bikeIds,
              sourceAvailableBikesBefore: totalAvailableCount,
              targetAvailableBikesBefore: targetAvailableCount,
            });
          })).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    cancel: args =>
      Effect.gen(function* () {
        const now = new Date();
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txRedistributionRepo = makeRedistributionRepository(tx);
            const txBikeRepo = makeBikeRepository(tx);

            const existingOpt = yield* txRedistributionRepo.findById(
              args.requestId,
            );

            if (Option.isNone(existingOpt)) {
              return yield* Effect.fail(
                new RedistributionRequestNotFound({
                  requestId: args.requestId,
                }),
              );
            }

            const existing = existingOpt.value;

            if (existing.requestedByUserId !== args.userId) {
              return yield* Effect.fail(
                new UnauthorizedRedistributionCancellation({
                  requestId: args.requestId,
                  requestedByUserId: existing.requestedByUserId,
                  cancelledByUserId: args.userId,
                }),
              );
            }

            if (existing.status !== RedistributionStatus.PENDING_APPROVAL) {
              return yield* Effect.fail(
                new CannotCancelNonPendingRedistribution({
                  requestId: args.requestId,
                  currentStatus: existing.status,
                }),
              );
            }

            const bikeIds = existing.items.map(item => item.bikeId);

            // Restore bikes to AVAILABLE if any were marked PENDING_DISPATCH
            if (bikeIds.length > 0) {
              yield* txBikeRepo.updateManyStatusAt(
                bikeIds,
                BikeStatus.AVAILABLE,
                now,
              );
            }

            const updatedOpt
              = yield* txRedistributionRepo.updateAndFindWithPopulation(
                {
                  id: args.requestId,
                },
                {
                  reason: args.reason,
                  status: RedistributionStatus.CANCELLED,
                },
              );

            return Option.getOrThrow(updatedOpt);
          })).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    startTransition: args =>
      Effect.gen(function* () {
        const now = new Date();
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txRedistributionRepo = makeRedistributionRepository(tx);
            const txBikeRepo = makeBikeRepository(tx);

            const existingRequest = yield* txRedistributionRepo.findById(
              args.requestId,
            );

            if (Option.isNone(existingRequest)) {
              return yield* Effect.fail(
                new RedistributionRequestNotFound({
                  requestId: args.requestId,
                }),
              );
            }

            const req = existingRequest.value;

            if (req.requestedByUserId !== args.userId) {
              return yield* Effect.fail(
                new UnauthorizedStartTransition({
                  requestId: args.requestId,
                  requestedByUserId: req.requestedByUserId,
                  startedByUserId: args.userId,
                }),
              );
            }

            if (req.status !== RedistributionStatus.APPROVED) {
              return yield* Effect.fail(
                new CannotStartTransitionNonApprovedRedistribution({
                  requestId: args.requestId,
                  currentStatus: req.status,
                }),
              );
            }

            const bikeIds = req.items.map(item => item.bikeId);
            const bikeQuantity = bikeIds.length;

            if (bikeQuantity === 0) {
              return yield* Effect.fail(
                new NoBikesInRedistributionRequest({
                  requestId: args.requestId,
                }),
              );
            }

            yield* txBikeRepo.updateManyStatusAt(
              bikeIds,
              BikeStatus.TRANSPORTING,
              now,
            );

            const updatedOpt
              = yield* txRedistributionRepo.updateAndFindWithPopulation(
                {
                  id: args.requestId,
                },
                {
                  status: RedistributionStatus.IN_TRANSIT,
                  startedAt: now,
                },
              );

            return Option.getOrThrow(updatedOpt);
          })).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    // start keeping redistribution slots for target station after request approved
    approve: args =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(args.approvedByUserId);
        const stationId = getUserStationId(user)!;
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txRedistributionRepo = makeRedistributionRepository(tx);
            const txStationRepo = makeStationQueryRepository(tx);

            const existingReqOpt = yield* txRedistributionRepo.findById(
              args.requestId,
            );
            if (Option.isNone(existingReqOpt)) {
              return yield* Effect.fail(
                new RedistributionRequestNotFound({
                  requestId: args.requestId,
                }),
              );
            }

            const existingReq = existingReqOpt.value;

            if (existingReq.targetStationId !== stationId) {
              return yield* Effect.fail(
                new UnauthorizedRedistributionApproval({
                  requestId: args.requestId,
                  targetStationId: existingReq.targetStationId,
                  workingStationId: stationId,
                }),
              );
            }
            if (existingReq.status !== RedistributionStatus.PENDING_APPROVAL) {
              return yield* Effect.fail(
                new CannotApproveNonPendingRedistribution({
                  requestId: args.requestId,
                  currentStatus: existingReq.status,
                }),
              );
            }

            const stationOpt = yield* txStationRepo.getById(stationId);
            if (Option.isNone(stationOpt)) {
              return yield* Effect.fail(
                new StationNotFound({
                  stationId,
                }),
              );
            }

            const station = stationOpt.value;
            if (station.availableReturnSlots < existingReq.requestedQuantity) {
              return yield* Effect.fail(
                new NotEnoughEmptySlotsAtTarget({
                  targetStationId: station.id,
                  required: existingReq.requestedQuantity,
                  available: station.availableReturnSlots,
                }),
              );
            }

            const updatedOpt
              = yield* txRedistributionRepo.updateAndFindWithPopulation(
                {
                  id: args.requestId,
                },
                {
                  status: RedistributionStatus.APPROVED,
                  approvedByUserId: args.approvedByUserId,
                },
              );

            return Option.getOrThrow(updatedOpt);
          })).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    reject: args =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(args.rejectedByUserId);
        const stationId = getUserStationId(user)!;
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txRedistributionRepo = makeRedistributionRepository(tx);
            const txBikeRepo = makeBikeRepository(tx);
            const now = new Date();

            const existingOpt = yield* txRedistributionRepo.findAndPopulate({
              id: args.requestId,
            });

            if (Option.isNone(existingOpt)) {
              return yield* Effect.fail(
                new RedistributionRequestNotFound({
                  requestId: args.requestId,
                }),
              );
            }

            const existing = existingOpt.value;

            // Authorization check
            if (existing.targetStation.id !== stationId) {
              return yield* Effect.fail(
                new UnauthorizedRedistributionRejection({
                  requestId: args.requestId,
                  targetStationId: existing.targetStation.id,
                  workingStationId: stationId,
                }),
              );
            }

            // Status check
            if (existing.status !== RedistributionStatus.PENDING_APPROVAL) {
              return yield* Effect.fail(
                new CannotRejectNonPendingRedistribution({
                  requestId: args.requestId,
                  currentStatus: existing.status,
                }),
              );
            }

            const bikeIds = existing.items.map(item => item.bike.id);

            // Restore bikes to AVAILABLE
            if (bikeIds.length > 0) {
              yield* txBikeRepo.updateManyStatusAt(
                bikeIds,
                BikeStatus.AVAILABLE,
                now,
              );
            }

            const updatedOpt
              = yield* txRedistributionRepo.updateAndFindWithPopulation(
                {
                  id: args.requestId,
                },
                {
                  status: RedistributionStatus.REJECTED,
                  rejectedByUserId: args.rejectedByUserId,
                  reason: args.reason,
                },
              );

            return Option.getOrThrow(updatedOpt);
          })).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    confirmCompletion: ({ requestId, confirmedByUserId, completedBikeIds }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(confirmedByUserId);
        const stationId = getUserStationId(user)!;

        return yield* runPrismaTransaction(client, (tx) => {
          const txRedistributionRepo = makeRedistributionRepository(tx);
          const txBikeRepo = makeBikeRepository(tx);

          return Effect.gen(function* () {
            const reqOpt = yield* txRedistributionRepo.findAndPopulate({
              id: requestId,
            });

            if (Option.isNone(reqOpt)) {
              return yield* Effect.fail(
                new RedistributionRequestNotFound({ requestId }),
              );
            }

            const req = reqOpt.value;

            // Authorization checks
            if (req.targetStation.id !== stationId) {
              return yield* Effect.fail(
                new UnauthorizedRedistributionCompletion({
                  requestId,
                  targetStationId: req.targetStation.id,
                  workingStationId: stationId,
                }),
              );
            }

            if (
              req.status !== RedistributionStatus.IN_TRANSIT
              && req.status !== RedistributionStatus.PARTIALLY_COMPLETED
            ) {
              return yield* Effect.fail(
                new CannotConfirmNonTransitedRedistribution({
                  requestId,
                  currentStatus: req.status,
                }),
              );
            }

            // Comparison logic
            const unconfirmedBikeIds = req.items
              .filter(item => item.bike.status === BikeStatus.TRANSPORTING)
              .map(item => item.bike.id);

            const validCompletedBikeIds = completedBikeIds.filter(id =>
              unconfirmedBikeIds.includes(id),
            );

            const validLength = validCompletedBikeIds.length;

            if (validLength === 0) {
              return yield* Effect.fail(
                new InvalidBikeIdsForRedistributionCompletion({
                  requestId,
                  providedBikeIds: completedBikeIds,
                  unconfirmedBikeIds,
                }),
              );
            }

            const isFullMatch = unconfirmedBikeIds.length === validLength;

            const finalStatus = isFullMatch
              ? RedistributionStatus.COMPLETED
              : RedistributionStatus.PARTIALLY_COMPLETED;

            const now = new Date();

            // Update item delivery status
            if (validLength > 0) {
              yield* txRedistributionRepo.updateItemDeliveredAt(
                requestId,
                validCompletedBikeIds,
                now,
              );

              yield* txBikeRepo.updateManyStatusAndStationAt(
                validCompletedBikeIds,
                BikeStatus.AVAILABLE,
                req.targetStation.id,
                now,
              );
            }
            // Update status
            const updatedReq = yield* txRedistributionRepo
              .updateAndFindWithPopulation(
                { id: requestId },
                {
                  status: finalStatus,
                  completedAt:
                    finalStatus === RedistributionStatus.COMPLETED
                      ? now
                      : undefined,
                },
              )
              .pipe(Effect.map(o => Option.getOrThrow(o)));

            return updatedReq;
          });
        }).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    revertRemaining: ({ requestId, userId, reason }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;

        return yield* runPrismaTransaction(client, (tx) => {
          const txRedistributionRepo = makeRedistributionRepository(tx);
          const txBikeRepo = makeBikeRepository(tx);

          return Effect.gen(function* () {
            const reqOpt = yield* txRedistributionRepo.findAndPopulate({
              id: requestId,
            });

            if (Option.isNone(reqOpt)) {
              return yield* Effect.fail(
                new RedistributionRequestNotFound({ requestId }),
              );
            }

            const req = reqOpt.value;

            // Authorization: Caller must belong to the target station
            if (req.targetStation.id !== stationId) {
              return yield* Effect.fail(
                new UnauthorizedRedistributionRevert({
                  requestId,
                  targetStationId: req.targetStation.id,
                  workingStationId: stationId,
                }),
              );
            }

            // Validation: Request must be in transit or already partially completed
            if (
              req.status !== RedistributionStatus.IN_TRANSIT
              && req.status !== RedistributionStatus.PARTIALLY_COMPLETED
            ) {
              return yield* Effect.fail(
                new CannotRevertNonTransitOrPartiallyCompletedRedistribution({
                  requestId,
                  currentStatus: req.status,
                }),
              );
            }

            // Gather all items that are still TRANSPORTING
            const transportingItems = req.items.filter(
              item => item.bike.status === BikeStatus.TRANSPORTING,
            );

            const now = new Date();

            if (transportingItems.length > 0) {
              const bikeIds = transportingItems.map(item => item.bike.id);
              // Return status of remaining bikes to AVAILABLE at source station
              yield* txBikeRepo.updateManyStatusAt(
                bikeIds,
                BikeStatus.AVAILABLE,
                now,
              );
            }

            // Finalize request status to REVERTED and store the reason
            const updatedReq = yield* txRedistributionRepo
              .updateAndFindWithPopulation(
                { id: requestId },
                {
                  status: RedistributionStatus.REVERTED,
                  reason,
                  revertedByUserId: userId,
                  completedAt: now,
                },
              )
              .pipe(Effect.map(o => Option.getOrThrow(o)));

            return updatedReq;
          });
        }).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
      }),

    adminListRequests: (filter, page) =>
      repo.listWithOffset(toRedistributionWhere(filter), page),

    adminGetById: requestId => repo.findAndPopulate({ id: requestId }),

    getHistoryForStaff: (userId, filter, page) =>
      repo.listWithOffset(
        toRedistributionWhere({
          ...filter,
          requestedByUserId: userId,
          statuses: filter.statuses ?? TERMINAL_STATUSES,
        }),
        page,
      ),

    getHistoryForManager: (userId, filter, page) =>
      getHistoryForStation(userId, filter, page),

    getHistoryForAgency: (userId, filter, page) =>
      getHistoryForStation(userId, filter, page),
  };
}

export const RedistributionServiceLive = Layer.effect(
  RedistributionServiceTag,
  makeRedistributionServiceEffect.pipe(
    Effect.map(RedistributionServiceTag.make),
  ),
);
