import { Effect, Layer, Option } from "effect";

import type { PageResult } from "@/domain/shared/pagination";
import type { PrismaClient } from "generated/prisma/client";

import { makeAgencyAccountProvisionService } from "@/domain/agency-account-provisioning";
import {
  makeStationQueryRepository,
  StationLocationAlreadyExists,
} from "@/domain/stations";
import { Prisma } from "@/infrastructure/prisma";

import type {
  AgencyRequestNotFound,
  AgencyRequestNotOwned,
  AgencyRequestRepositoryError,
  InvalidAgencyRequestStatusTransition,
} from "../domain-errors";
import type {
  AgencyRequestFilter,
  AgencyRequestPageRequest,
  AgencyRequestRow,
  ApproveAgencyRequestInput,
  ReviewAgencyRequestInput,
  SubmitAgencyRequestInput,
} from "../models";
import type { AgencyRequestRepo } from "../repository/agency-request.repository";

import {
  AgencyRequestNotFound as AgencyRequestNotFoundError,
  AgencyRequestNotOwned as AgencyRequestNotOwnedError,
  AgencyRequestRepositoryError as AgencyRequestRepositoryErrorData,
  InvalidAgencyRequestStatusTransition as InvalidAgencyRequestStatusTransitionError,
} from "../domain-errors";
import {
  AgencyRequestRepository,
  makeAgencyRequestRepository,
} from "../repository/agency-request.repository";

export type AgencyRequestService = {
  getById: (
    id: string,
  ) => Effect.Effect<
    Option.Option<AgencyRequestRow>,
    AgencyRequestRepositoryError
  >;
  getByIdOrFail: (
    id: string,
  ) => Effect.Effect<
    AgencyRequestRow,
    AgencyRequestRepositoryError | AgencyRequestNotFound
  >;
  list: (
    filter?: AgencyRequestFilter,
  ) => Effect.Effect<readonly AgencyRequestRow[], AgencyRequestRepositoryError>;
  listWithOffset: (
    filter: AgencyRequestFilter,
    pageReq: AgencyRequestPageRequest,
  ) => Effect.Effect<
    PageResult<AgencyRequestRow>,
    AgencyRequestRepositoryError
  >;
  submit: (
    input: SubmitAgencyRequestInput,
  ) => Effect.Effect<
    AgencyRequestRow,
    AgencyRequestRepositoryError | StationLocationAlreadyExists
  >;
  approve: (
    agencyRequestId: string,
    input: ApproveAgencyRequestInput,
  ) => Effect.Effect<
    AgencyRequestRow,
    | AgencyRequestRepositoryError
    | AgencyRequestNotFound
    | InvalidAgencyRequestStatusTransition
    | StationLocationAlreadyExists
  >;
  reject: (
    agencyRequestId: string,
    input: ReviewAgencyRequestInput,
  ) => Effect.Effect<
    AgencyRequestRow,
    | AgencyRequestRepositoryError
    | AgencyRequestNotFound
    | InvalidAgencyRequestStatusTransition
  >;
  cancel: (
    agencyRequestId: string,
    description?: string | null,
  ) => Effect.Effect<
    AgencyRequestRow,
    | AgencyRequestRepositoryError
    | AgencyRequestNotFound
    | InvalidAgencyRequestStatusTransition
  >;
  cancelAsRequester: (
    agencyRequestId: string,
    requesterUserId: string,
  ) => Effect.Effect<
    AgencyRequestRow,
    | AgencyRequestRepositoryError
    | AgencyRequestNotFound
    | AgencyRequestNotOwned
    | InvalidAgencyRequestStatusTransition
  >;
};

function makeAgencyRequestService(
  repo: AgencyRequestRepo,
  client: PrismaClient,
): AgencyRequestService {
  const provisionService = makeAgencyAccountProvisionService(client);
  const stationQueryRepo = makeStationQueryRepository(client);

  return {
    getById: id => repo.findById(id),
    getByIdOrFail: id =>
      Effect.gen(function* () {
        const found = yield* repo.findById(id);
        if (Option.isNone(found)) {
          return yield* Effect.fail(
            new AgencyRequestNotFoundError({ agencyRequestId: id }),
          );
        }
        return found.value;
      }),
    list: filter => repo.list(filter),
    listWithOffset: (filter, pageReq) => repo.listWithOffset(filter, pageReq),
    submit: input =>
      Effect.gen(function* () {
        const stationExists = yield* stationQueryRepo.existsByExactLocation({
          address: input.stationAddress,
          latitude: input.stationLatitude,
          longitude: input.stationLongitude,
        });

        if (stationExists) {
          return yield* Effect.fail(
            new StationLocationAlreadyExists({
              address: input.stationAddress,
              latitude: input.stationLatitude,
              longitude: input.stationLongitude,
            }),
          );
        }

        return yield* repo.submit(input);
      }),
    approve: (agencyRequestId, input) =>
      Effect.gen(function* () {
        const txAgencyRequestRepo = makeAgencyRequestRepository(client);
        const found = yield* txAgencyRequestRepo.findById(agencyRequestId);

        if (Option.isNone(found)) {
          return yield* Effect.fail(
            new AgencyRequestNotFoundError({ agencyRequestId }),
          );
        }

        const agencyRequest = found.value;
        if (agencyRequest.status !== "PENDING") {
          return yield* Effect.fail(
            new InvalidAgencyRequestStatusTransitionError({
              agencyRequestId: agencyRequest.id,
              currentStatus: agencyRequest.status,
              nextStatus: "APPROVED",
            }),
          );
        }

        if (
          !agencyRequest.stationName
          || !agencyRequest.stationAddress
          || agencyRequest.stationLatitude == null
          || agencyRequest.stationLongitude == null
          || agencyRequest.stationTotalCapacity == null
        ) {
          return yield* Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation.missingStationMetadata",
              cause: new Error(
                `Agency request ${agencyRequest.id} is missing station metadata`,
              ),
            }),
          );
        }

        const provisioned = yield* provisionService.approveExistingRequest(
          agencyRequest,
          input,
        );

        return provisioned.agencyRequest;
      }).pipe(
        Effect.catchTag("AgencyRepositoryError", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgency",
              cause: err,
            }),
          )),
        Effect.catchTag("DuplicateUserEmail", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgencyUser",
              cause: err,
            }),
          )),
        Effect.catchTag("DuplicateUserPhoneNumber", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgencyUser",
              cause: err,
            }),
          )),
        Effect.catchTag("InvalidOrgAssignment", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgencyUser",
              cause: err,
            }),
          )),
        Effect.catchTag("TechnicianTeamMemberLimitExceeded", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgencyUser",
              cause: err,
            }),
          )),
        Effect.catchTag("StationRoleAssignmentLimitExceeded", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgencyUser",
              cause: err,
            }),
          )),
        Effect.catchTag("StationNameAlreadyExists", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationOutsideSupportedArea", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationCapacityLimitExceeded", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationCapacitySplitInvalid", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationAgencyRequired", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationAgencyForbidden", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationAgencyNotFound", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("StationAgencyAlreadyAssigned", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createStation",
              cause: err,
            }),
          )),
        Effect.catchTag("PrismaTransactionError", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.transaction",
              cause: err,
            }),
          )),
      ),
    reject: (agencyRequestId, input) => repo.reject(agencyRequestId, input),
    cancel: (agencyRequestId, description) =>
      repo.cancel(agencyRequestId, description),
    cancelAsRequester: (agencyRequestId, requesterUserId) =>
      Effect.gen(function* () {
        const found = yield* repo.findById(agencyRequestId);
        if (Option.isNone(found)) {
          return yield* Effect.fail(
            new AgencyRequestNotFoundError({ agencyRequestId }),
          );
        }

        const agencyRequest = found.value;

        if (agencyRequest.requesterUserId !== requesterUserId) {
          return yield* Effect.fail(
            new AgencyRequestNotOwnedError({
              agencyRequestId: agencyRequest.id,
              userId: requesterUserId,
            }),
          );
        }

        return yield* repo.cancel(agencyRequest.id);
      }),
  };
}

const makeAgencyRequestServiceEffect = Effect.gen(function* () {
  const repo = yield* AgencyRequestRepository;
  const { client } = yield* Prisma;
  return makeAgencyRequestService(repo, client);
});

export class AgencyRequestServiceTag extends Effect.Service<AgencyRequestServiceTag>()(
  "AgencyRequestService",
  {
    effect: makeAgencyRequestServiceEffect,
  },
) {}

export const AgencyRequestServiceLive = Layer.effect(
  AgencyRequestServiceTag,
  makeAgencyRequestServiceEffect.pipe(Effect.map(AgencyRequestServiceTag.make)),
);
