import { Effect, Layer, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { PrismaClient } from "generated/prisma/client";

import { BikeRepositoryError, makeBikeRepository } from "@/domain/bikes";
import { StationServiceTag } from "@/domain/stations";
import { UserQueryServiceTag, UserRepositoryError } from "@/domain/users";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { RedistributionStatus } from "generated/prisma/client";

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
  CannotCancelNonPendingRedistribution,
  ExceededMinBikesAtStation,
  NotEnoughBikesAtStation,
  NotEnoughEmptySlotsAtTarget,
  RedistributionRepositoryError,
  RedistributionRequestNotFound,
  StationNotFound,
  UnauthorizedRedistributionAccess,
  UnauthorizedRedistributionCancellation,
  UnauthorizedRedistributionCreation,
  UserNotFound,
} from "../domain-errors";
import {
  makeRedistributionRepository,
  RedistributionRepository,
} from "../repository/redistribution.repository";

const MIN_BIKES_AT_STATION = 10;

export type RedistributionService = {
  getMyListInStation: (
    userId: string,
    filter: MyInStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure | UserRepositoryError
  >;

  getMyRequestInStation: (args: {
    userId: string;
    requestId: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | UserRepositoryError
  >;

  getListInStation: (
    userId: string,
    filter: InStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure | UserRepositoryError
  >;

  getRequestInStation: (args: {
    userId: string;
    requestId: string;
  }) => Effect.Effect<
    RedistributionRequestDetailRow,
    RedistributionServiceFailure | UserRepositoryError
  >;

  createRequestTo: (args: {
    requestedByUserId: string;
    sourceStationId: string;
    targetStationId?: string | null;
    targetAgencyId?: string | null;
    requestedQuantity: number;
    reason: string;
  }) => Effect.Effect<
    RedistributionRequestRow,
    RedistributionServiceFailure | UserRepositoryError,
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

  approve: (args: {
    requestId: string;
    approvedByUserId?: string | null;
  }) => Effect.Effect<
    Option.Option<RedistributionRequestRow>,
    RedistributionServiceFailure
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
      const userOpt = yield* userService.getById(userId).pipe(
        Effect.catchTag("UserRepositoryError", e =>
          Effect.fail(
            new UserRepositoryError({
              operation: "assertUserExists",
              cause: e,
            }),
          )),
      );

      if (Option.isNone(userOpt)) {
        return yield* Effect.fail(new UserNotFound({ userId }));
      }
      return userOpt.value;
    });

  const getUserStationId = (user: any) => user.orgAssignment?.station?.id;

  return {
    getMyListInStation: (userId, filter, page) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user);
        // TODO: handle agency case
        return yield* repo
          .listWithOffset(
            {
              ...filter,
              requestedByUserId: userId,
              sourceStationId: stationId,
            },
            page,
          )
          .pipe(
            Effect.catchTag("RedistributionRepositoryError", error =>
              Effect.fail(
                new RedistributionRepositoryError({
                  operation: "getMyListInStation",
                  cause: error,
                }),
              )),
          );
      }),

    getMyRequestInStation: ({ userId, requestId }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user);
        // TODO: handle agency case
        const reqOpt = yield* repo
          .findAndPopulate({
            id: requestId,
            requestedByUserId: userId,
            sourceStationId: stationId,
          })
          .pipe(Effect.catchTag("RedistributionRepositoryError", Effect.die));

        if (Option.isSome(reqOpt))
          return reqOpt.value;

        const existing = yield* repo
          .findById(requestId)
          .pipe(Effect.catchTag("RedistributionRepositoryError", Effect.die));
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
        const stationId = getUserStationId(user);
        // TODO: handle agency case
        return yield* repo
          .listWithOffset(
            {
              ...filter,
              sourceStationId: stationId,
            },
            page,
          )
          .pipe(
            Effect.catchTag("RedistributionRepositoryError", error =>
              Effect.fail(
                new RedistributionRepositoryError({
                  operation: "getListInStation",
                  cause: error,
                }),
              )),
          );
      }),

    getRequestInStation: ({ userId, requestId }) =>
      Effect.gen(function* () {
        const user = yield* assertUserExists(userId);
        const stationId = getUserStationId(user);
        // TODO: handle agency case
        const reqOpt = yield* repo
          .findAndPopulate({
            id: requestId,
            sourceStationId: stationId,
          })
          .pipe(
            Effect.catchTag("RedistributionRepositoryError", error =>
              Effect.fail(
                new RedistributionRepositoryError({
                  operation: "getRequestInStation.findAndPopulate",
                  cause: error,
                }),
              )),
          );

        if (Option.isSome(reqOpt)) {
          return reqOpt.value;
        }

        const existing = yield* repo.findById(requestId).pipe(
          Effect.catchTag("RedistributionRepositoryError", error =>
            Effect.fail(
              new RedistributionRepositoryError({
                operation: "getRequestInStation.findById",
                cause: error,
              }),
            )),
        );
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

        const sourceStation = yield* stationService
          .getStationById(args.sourceStationId)
          .pipe(
            Effect.catchTag("StationNotFound", () =>
              Effect.fail(
                new StationNotFound({ stationId: args.sourceStationId }),
              )),
          );

        // Authorization: user must belong to source station
        if (getUserStationId(user) !== sourceStation.id) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionCreation({
              userId: args.requestedByUserId,
              sourceStationId: args.sourceStationId,
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
        // TODO: implement agency check
        if (args.targetStationId) {
          const targetStation = yield* stationService
            .getStationById(args.targetStationId)
            .pipe(
              Effect.catchTag("StationNotFound", () =>
                Effect.fail(
                  new StationNotFound({ stationId: args.targetStationId! }),
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

        const bikeIds = availableBikes.map(b => b.id);

        // Transaction
        return yield* runPrismaTransaction(client, tx =>
          Effect.gen(function* () {
            const txBikeRepo = makeBikeRepository(tx);
            const txRedistributionRepo = makeRedistributionRepository(tx);
            // Marks bikes as unavailable

            const updatedBikesCount = yield* txBikeRepo
              .markBikesUnavailableIfAvailable(bikeIds, new Date())
              .pipe(
                Effect.catchTag("BikeRepositoryError", error =>
                  Effect.die(error)),
              );
            // TODO: Update empty slots at source and target stations

            if (updatedBikesCount !== args.requestedQuantity) {
              return yield* Effect.fail(
                new NotEnoughBikesAtStation({
                  stationId: args.sourceStationId,
                  required: args.requestedQuantity,
                  available: updatedBikesCount,
                }),
              );
            }
            return yield* txRedistributionRepo
              .create({
                ...args,
                bikeIds,
              })
              .pipe(
                Effect.catchTag("RedistributionRepositoryError", error =>
                  Effect.die(error)),
              );
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
            const updatedOpt = yield* txRedistributionRepo
              .update(
                {
                  id: args.requestId,
                  requestedByUserId: args.userId,
                  status: RedistributionStatus.PENDING_APPROVAL,
                },
                {
                  reason: args.reason,
                  status: RedistributionStatus.CANCELLED,
                },
              )
              .pipe(
                Effect.catchTag("RedistributionRepositoryError", e =>
                  Effect.fail(
                    new RedistributionRepositoryError({
                      operation: "cancel",
                      cause: e,
                    }),
                  )),
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
                ).pipe(
                  Effect.catchTag("BikeRepositoryError", e =>
                    Effect.fail(
                      new BikeRepositoryError({
                        operation: "cancel",
                        cause: e,
                      }),
                    )),
                );
              }

              return request;
            }

            // Update failed
            const existingRequest = yield* txRedistributionRepo
              .findById(args.requestId)
              .pipe(
                Effect.catchTag("RedistributionRepositoryError", e =>
                  Effect.fail(
                    new RedistributionRepositoryError({
                      operation: "cancel",
                      cause: e,
                    }),
                  )),
              );

            if (Option.isSome(existingRequest)) {
              const req = existingRequest.value;

              if (req.requestedByUserId !== args.userId) {
                return yield* Effect.fail(
                  new UnauthorizedRedistributionCancellation({
                    requestId: args.requestId,
                    requestedByUserId: req.requestedByUserId,
                    userId: args.userId,
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

    approve: args =>
      repo
        .update(
          { id: args.requestId },
          {
            status: RedistributionStatus.APPROVED,
            approvedByUserId: args.approvedByUserId,
          },
        )
        .pipe(
          Effect.catchTag("RedistributionRepositoryError", error =>
            Effect.die(error)),
        ),

    adminListRequests: (filter, page) =>
      repo.listWithOffset(filter, page).pipe(
        Effect.catchTag("RedistributionRepositoryError", error =>
          Effect.fail(
            new RedistributionRepositoryError({
              operation: "adminListRequests.listWithOffset",
              cause: error,
            }),
          )),
      ),

    adminGetById: requestId =>
      repo.findAndPopulate({ id: requestId }).pipe(
        Effect.catchTag("RedistributionRepositoryError", error =>
          Effect.fail(
            new RedistributionRepositoryError({
              operation: "adminGetById.findAndPopulate",
              cause: error,
            }),
          )),
      ),
  };
}

export const RedistributionServiceLive = Layer.effect(
  RedistributionServiceTag,
  makeRedistributionServiceEffect.pipe(
    Effect.map(RedistributionServiceTag.make),
  ),
);
