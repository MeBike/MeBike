import { Effect, Layer, Option } from "effect";

import type { BikeRepository, BikeRepositoryError } from "@/domain/bikes";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { UserRow } from "@/domain/users";
import type { PrismaClient } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { StationServiceTag } from "@/domain/stations";
import { UserQueryServiceTag, UserRepositoryError } from "@/domain/users";
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
    RedistributionRequestRow,
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

  return {
    getMyListInStation: (userId, filter, page) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;
        return yield* repo.listWithOffset(
          {
            ...filter,
            requestedByUserId: userId,
            sourceStationId: stationId,
          },
          page,
        );
      }),

    getMyRequestInStation: ({ userId, requestId }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;
        const reqOpt = yield* repo.findAndPopulate({
          id: requestId,
          requestedByUserId: userId,
          sourceStationId: stationId,
        });

        if (Option.isSome(reqOpt))
          return reqOpt.value;

        const existing = yield* repo.findById(requestId);
        if (
          Option.isSome(existing)
          && existing.value.requestedByUserId !== userId
        ) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionAccess({ userId, requestId }),
          );
        }

        return yield* Effect.fail(
          new RedistributionRequestNotFound({ requestId }),
        );
      }),

    getListInStation: (userId, filter, page) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;
        return yield* repo.listWithOffset(
          {
            ...filter,
            sourceStationId: stationId,
          },
          page,
        );
      }),

    getRequestInStation: ({ userId, requestId }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user)!;
        const reqOpt = yield* repo.findAndPopulate({
          id: requestId,
          sourceStationId: stationId,
        });

        if (Option.isSome(reqOpt)) {
          return reqOpt.value;
        }

        const existing = yield* repo.findById(requestId);
        if (
          Option.isSome(existing)
          && existing.value.requestedByUserId !== userId
        ) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionAccess({ userId, requestId }),
          );
        }

        return yield* Effect.fail(
          new RedistributionRequestNotFound({ requestId }),
        );
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
            yield* Effect.all(
              bikeIds.map(bikeId =>
                txBikeRepo.updateStatusAt(bikeId, "UNAVAILABLE", now),
              ),
              { concurrency: "unbounded" },
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
            const updatedOpt = yield* txRedistributionRepo.update(
              {
                id: args.requestId,
                requestedByUserId: args.userId,
                status: RedistributionStatus.PENDING_APPROVAL,
              },
              {
                reason: args.reason,
                status: RedistributionStatus.CANCELLED,
              },
            );

            // Update success
            if (Option.isSome(updatedOpt)) {
              const request = updatedOpt.value;
              const bikeIds = request.items.map(item => item.bikeId);

              // Restore bikes to AVAILABLE if any were marked unavailable
              if (bikeIds.length > 0) {
                yield* Effect.all(
                  bikeIds.map(bikeId =>
                    txBikeRepo.updateStatusAt(bikeId, "AVAILABLE", now),
                  ),
                  { concurrency: "unbounded" },
                  // TODO: update empty slots at source and target station
                );
              }

              return request;
            }

            // Update failed
            const existingRequest = yield* txRedistributionRepo.findById(
              args.requestId,
            );

            if (Option.isSome(existingRequest)) {
              const req = existingRequest.value;

              if (req.requestedByUserId !== args.userId) {
                return yield* Effect.fail(
                  new UnauthorizedRedistributionCancellation({
                    requestId: args.requestId,
                    requestedByUserId: req.requestedByUserId,
                    cancelledByUserId: args.userId,
                  }),
                );
              }

              if (req.status !== RedistributionStatus.PENDING_APPROVAL) {
                return yield* Effect.fail(
                  new CannotCancelNonPendingRedistribution({
                    requestId: args.requestId,
                    currentStatus: req.status,
                  }),
                );
              }
            }
            return yield* Effect.fail(
              new RedistributionRequestNotFound({
                requestId: args.requestId,
              }),
            );
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
            const updatedOpt
              = yield* txRedistributionRepo.updateAndFindWithPopulation(
                {
                  id: args.requestId,
                  status: RedistributionStatus.APPROVED,
                },
                {
                  status: RedistributionStatus.IN_TRANSIT,
                  startedAt: now,
                },
              );

            // Update success
            if (Option.isSome(updatedOpt)) {
              return updatedOpt.value;
            }

            // Update failed
            const existingRequest = yield* txRedistributionRepo.findById(
              args.requestId,
            );

            if (Option.isSome(existingRequest)) {
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
            }
            return yield* Effect.fail(
              new RedistributionRequestNotFound({
                requestId: args.requestId,
              }),
            );
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
        // TODO: handle agency case
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txRedistributionRepo = makeRedistributionRepository(tx);
            const txBikeRepo = makeBikeRepository(tx);
            const now = new Date();

            const updatedOpt
              = yield* txRedistributionRepo.updateAndFindWithPopulation(
                {
                  id: args.requestId,
                  targetStationId: stationId,
                  status: RedistributionStatus.PENDING_APPROVAL,
                },
                {
                  status: RedistributionStatus.REJECTED,
                  reason: args.reason,
                },
              );
            // Update success – restore bikes to AVAILABLE
            if (Option.isSome(updatedOpt)) {
              const request = updatedOpt.value;
              const bikeIds = request.items.map(item => item.bike.id);

              if (bikeIds.length > 0) {
                yield* Effect.all(
                  bikeIds.map(bikeId =>
                    txBikeRepo.updateStatusAt(bikeId, "AVAILABLE", now),
                  ),
                  { concurrency: "unbounded" },
                );
              }

              return request;
            }

            // Update failed
            const existingReq = yield* txRedistributionRepo.findById(
              args.requestId,
            );

            if (Option.isSome(existingReq)) {
              const req = existingReq.value;

              if (req.targetStationId !== stationId) {
                return yield* Effect.fail(
                  new UnauthorizedRedistributionRejection({
                    requestId: args.requestId,
                    targetStationId: req.targetStationId,
                    workingStationId: stationId,
                  }),
                );
              }

              if (req.status !== RedistributionStatus.PENDING_APPROVAL) {
                return yield* Effect.fail(
                  new CannotRejectNonPendingRedistribution({
                    requestId: args.requestId,
                    currentStatus: req.status,
                  }),
                );
              }
            }

            return yield* Effect.fail(
              new RedistributionRequestNotFound({ requestId: args.requestId }),
            );
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

              yield* Effect.all(
                validCompletedBikeIds.map(bikeId =>
                  txBikeRepo.updateStatusAndStationAt(
                    bikeId,
                    "AVAILABLE",
                    req.targetStation.id,
                    now,
                  ),
                ),
                { concurrency: "unbounded" },
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

    adminListRequests: (filter, page) => repo.listWithOffset(filter, page),

    adminGetById: requestId => repo.findAndPopulate({ id: requestId }),
  };
}

export const RedistributionServiceLive = Layer.effect(
  RedistributionServiceTag,
  makeRedistributionServiceEffect.pipe(
    Effect.map(RedistributionServiceTag.make),
  ),
);
