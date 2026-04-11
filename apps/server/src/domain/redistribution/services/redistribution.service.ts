import { Effect, Layer, Option } from "effect";

import type { BikeRepository, BikeRepositoryError } from "@/domain/bikes";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { UserRow } from "@/domain/users";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { StationServiceTag } from "@/domain/stations";
import { UserQueryServiceTag } from "@/domain/users";
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
  CannotStartTransitionNonApprovedRedistribution,
  ExceededMinBikesAtStation,
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
  UnauthorizedStartTransition,
  UserNotFound,
} from "../domain-errors";
import {
  makeRedistributionRepository,
  RedistributionRepository,
} from "../repository/redistribution.repository";

const MIN_BIKES_AT_STATION = 1;

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
  const stationService = yield* StationServiceTag;
  const { client } = yield* Prisma;
  return makeRedistributionService(repo, userService, stationService, client);
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
  stationService: StationServiceTag,
  client: PrismaClient,
): RedistributionService {
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

  const toRedistributionWhere = (filter: AdminRedistributionFilter): PrismaTypes.RedistributionRequestWhereInput => {
    const where: PrismaTypes.RedistributionRequestWhereInput = {
      requestedByUserId: filter.requestedByUserId,
      approvedByUserId: filter.approvedByUserId,
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

  const TERMINAL_STATUSES: RedistributionStatus[] = [
    RedistributionStatus.COMPLETED,
    RedistributionStatus.CANCELLED,
    RedistributionStatus.REJECTED,
  ];

  const getHistoryForStation = (userId: string, filter: any, page: PageRequest<RedistributionSortField>) =>
    Effect.gen(function* () {
      const user = yield* assertUserExists(userId);
      const stationId = getUserStationId(user)!;

      return yield* repo.listWithOffset(
        toRedistributionWhere({
          ...filter,
          statuses: filter.statuses ?? TERMINAL_STATUSES,
          OR: [
            { sourceStationId: stationId },
            { targetStationId: stationId },
          ],
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
        return yield* repo.listWithOffset (
          toRedistributionWhere({
            ...filter,
            OR: [
              { sourceStationId: stationId },
              { targetStationId: stationId },
            ],
          }),
          page,
        );
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

        return req;
      }),

    createRequestTo: args =>
      Effect.gen(function* () {
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

        // Business rules:
        // Check if source station has enough available bikes to meet the requested quantity
        if (sourceStation.availableBikes < args.requestedQuantity) {
          return yield* Effect.fail(
            new NotEnoughBikesAtStation({
              stationId: args.sourceStationId,
              required: args.requestedQuantity,
              available: sourceStation.availableBikes,
            }),
          );
        }

        // Check if target station or agency has enough empty slot to meet the requested quantity
        const targetStation = yield* stationService
          .getStationById(args.targetStationId)
          .pipe(
            Effect.catchTag("StationNotFound", () =>
              Effect.fail(
                new StationNotFound({ stationId: args.targetStationId }),
              )),
          );

        if (targetStation.emptySlots < args.requestedQuantity) {
          return yield* Effect.fail(
            new NotEnoughEmptySlotsAtTarget({
              targetId: args.targetStationId,
              required: args.requestedQuantity,
              available: targetStation.emptySlots,
            }),
          );
        }

        // Fetch bikes + check minimum remaining bikes
        const [availableBikes, totalBikes] = yield* Effect.all([
          Effect.promise(() =>
            client.bike.findMany({
              where: { stationId: sourceStation.id, status: "AVAILABLE" },
              take: args.requestedQuantity,
              select: { id: true },
            }),
          ),
          Effect.promise(() =>
            client.bike.count({
              where: { stationId: sourceStation.id },
            }),
          ),
        ]);

        const restBikes = totalBikes - availableBikes.length;

        if (availableBikes.length < args.requestedQuantity) {
          return yield* Effect.fail(
            new NotEnoughBikesAtStation({
              stationId: args.sourceStationId,
              required: args.requestedQuantity,
              available: availableBikes.length,
            }),
          );
        }

        if (restBikes < MIN_BIKES_AT_STATION) {
          return yield* Effect.fail(
            new ExceededMinBikesAtStation({
              stationId: args.sourceStationId,
              minBikes: MIN_BIKES_AT_STATION,
              restBikesAfterFulfillment: restBikes,
            }),
          );
        }

        const now = new Date();
        const bikeIds = availableBikes.map(b => b.id);

        // Transaction
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txBikeRepo = makeBikeRepository(tx);
            const txRedistributionRepo = makeRedistributionRepository(tx);

            // Marks bikes as unavailable
            yield* txBikeRepo.updateManyStatusAt(
              bikeIds,
              BikeStatus.UNAVAILABLE,
              now,
            );

            // TODO: Update empty slots at source and target stations
            return yield* txRedistributionRepo.create({
              ...args,
              bikeIds,
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

            // Restore bikes to AVAILABLE if any were marked unavailable
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
            if (bikeIds.length === 0) {
              return yield* Effect.fail(
                new NoBikesInRedistributionRequest({
                  requestId: args.requestId,
                }),
              );
            }

            yield* txBikeRepo.updateManyStationAt(bikeIds, null, now);

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

    approve: args =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(args.approvedByUserId);
        const stationId = getUserStationId(user)!;
        const updatedOpt = yield* repo.updateAndFindWithPopulation(
          {
            id: args.requestId,
            targetStationId: stationId,
            status: RedistributionStatus.PENDING_APPROVAL,
          },
          {
            status: RedistributionStatus.APPROVED,
            approvedByUserId: args.approvedByUserId,
          },
        );

        // Update success
        if (Option.isSome(updatedOpt))
          return updatedOpt.value;

        // Update failed
        const existingReq = yield* repo.findById(args.requestId);
        if (Option.isSome(existingReq)) {
          const req = existingReq.value;
          if (req.targetStationId !== stationId) {
            return yield* Effect.fail(
              new UnauthorizedRedistributionApproval({
                requestId: args.requestId,
                targetStationId: req.targetStationId,
                workingStationId: stationId,
              }),
            );
          }
          if (req.status !== RedistributionStatus.PENDING_APPROVAL) {
            return yield* Effect.fail(
              new CannotApproveNonPendingRedistribution({
                requestId: args.requestId,
                currentStatus: req.status,
              }),
            );
          }
        }
        return yield* Effect.fail(
          new RedistributionRequestNotFound({ requestId: args.requestId }),
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
              .filter(item => item.bike.status === BikeStatus.UNAVAILABLE)
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

            const isFullMatch
              = unconfirmedBikeIds.length === validCompletedBikeIds.length;

            const finalStatus = isFullMatch
              ? RedistributionStatus.COMPLETED
              : RedistributionStatus.PARTIALLY_COMPLETED;

            const now = new Date();

            // Update item delivery status
            if (validCompletedBikeIds.length > 0) {
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

    adminListRequests: (filter, page) => repo.listWithOffset(toRedistributionWhere(filter), page),

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
