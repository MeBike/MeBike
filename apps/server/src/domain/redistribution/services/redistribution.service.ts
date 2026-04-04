import { Effect, Layer, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { PrismaClient } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { StationServiceTag } from "@/domain/stations";
import { UserQueryServiceTag } from "@/domain/users";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RedistributionServiceFailure } from "../domain-errors";
import type {
  AdminRedistributionFilter,
  MyInStationRedistributionFilter,
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
  RedistributionSortField,
} from "../models";
import type { RedistributionRepo } from "../repository/redistribution.repository";

import {
  ExceededMinBikesAtStation,
  NotEnoughBikesAtStation,
  NotEnoughEmptySlotsAtTarget,
  StationNotFound,
  UnauthorizedRedistributionCreation,
  UserNotFound,
} from "../domain-errors";
import {
  makeRedistributionRepository,
  RedistributionRepository,
} from "../repository/redistribution.repository";

const MIN_BIKES_AT_STATION = 20;

export type RedistributionService = {
  listMyRequests: (
    userId: string,
    filter: MyInStationRedistributionFilter,
    page: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionServiceFailure | UserNotFound
  >;

  getMyRequestById: (args: {
    userId: string;
    requestId: string;
  }) => Effect.Effect<
    Option.Option<RedistributionRequestDetailRow>,
    RedistributionServiceFailure
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
    RedistributionServiceFailure | UserNotFound,
    Prisma | RedistributionRepository | BikeRepository
  >;

  updateRequestStatus: (args: {
    requestId: string;
    status: string;
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

  findById: (
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
  return {
    listMyRequests: (userId, filter, page) =>
      Effect.gen(function* () {
        const userOpt = yield* userService
          .getById(userId)
          .pipe(
            Effect.catchTag("UserRepositoryError", error =>
              Effect.die(error)),
          );
        if (Option.isNone(userOpt)) {
          return yield* Effect.fail(new UserNotFound({ userId }));
        }
        const stationId = userOpt.value.orgAssignment?.station?.id;
        const reqOpt = yield* repo
          .listMyInStationRequests(userId, stationId ?? "", filter, page)
          .pipe(
            Effect.catchTag("RedistributionRepositoryError", error =>
              Effect.die(error)),
          );

        return reqOpt;
      }),

    getMyRequestById: ({ userId, requestId }) => {
      const stationId = "";
      return repo
        .getMyInStationRequest(userId, stationId, requestId)
        .pipe(
          Effect.catchTag("RedistributionRepositoryError", error =>
            Effect.die(error)),
        );
    },

    createRequestTo: args =>
      Effect.gen(function* () {
        // Check if source station is creator's one
        const userOpt = yield* userService
          .getById(args.requestedByUserId)
          .pipe(
            Effect.catchTag("UserRepositoryError", error =>
              Effect.die(error)),
          );
        if (Option.isNone(userOpt)) {
          return yield* Effect.fail(
            new UserNotFound({ userId: args.requestedByUserId }),
          );
        }

        const sourceStation = yield* stationService
          .getStationById(args.sourceStationId)
          .pipe(
            Effect.catchTag("StationNotFound", () =>
              Effect.fail(
                new StationNotFound({ stationId: args.sourceStationId }),
              )),
          );

        const userStationId = userOpt.value.orgAssignment?.station?.id;
        if (userStationId !== sourceStation.id) {
          return yield* Effect.fail(
            new UnauthorizedRedistributionCreation({
              userId: args.requestedByUserId,
              sourceStationId: args.sourceStationId,
            }),
          );
        }

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

        // Pick bike list, create item list and create request with items
        const [availableBikes, allBikesCount] = yield* Effect.all([
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

        if (availableBikes.length < args.requestedQuantity) {
          return yield* Effect.fail(
            new NotEnoughBikesAtStation({
              stationId: args.sourceStationId,
              required: args.requestedQuantity,
              available: availableBikes.length,
            }),
          );
        }

        const restBikes = allBikesCount - availableBikes.length;
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
        const req = yield* runPrismaTransaction(client, tx =>
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
            const req = yield* txRedistributionRepo
              .create({
                requestedByUserId: args.requestedByUserId,
                sourceStationId: args.sourceStationId,
                targetStationId: args.targetStationId,
                targetAgencyId: args.targetAgencyId,
                requestedQuantity: args.requestedQuantity,
                reason: args.reason,
                bikeIds,
              })
              .pipe(
                Effect.catchTag("RedistributionRepositoryError", error =>
                  Effect.die(error)),
              );

            return req;
          })).pipe(
          Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
        );
        return req;
      }),

    updateRequestStatus: args =>
      repo
        .updateStatus({
          requestId: args.requestId,
          status: args.status as any,
          approvedByUserId: args.approvedByUserId,
        })
        .pipe(
          Effect.catchTag("RedistributionRepositoryError", error =>
            Effect.die(error)),
        ),

    adminListRequests: (filter, page) =>
      repo
        .adminListRequests(filter, page)
        .pipe(
          Effect.catchTag("RedistributionRepositoryError", error =>
            Effect.die(error)),
        ),

    findById: requestId =>
      repo
        .findById(requestId)
        .pipe(
          Effect.catchTag("RedistributionRepositoryError", error =>
            Effect.die(error)),
        ),
  };
}

export const RedistributionServiceLive = Layer.effect(
  RedistributionServiceTag,
  makeRedistributionServiceEffect.pipe(
    Effect.map(RedistributionServiceTag.make),
  ),
);
