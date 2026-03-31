import { Effect, Layer, Option } from "effect";
import crypto from "node:crypto";

import type { PageResult } from "@/domain/shared/pagination";
import type { PrismaClient, UserRole } from "generated/prisma/client";

import { makeAgencyRepository, makeAgencyService } from "@/domain/agencies";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { buildAgencyApprovedEmail } from "@/lib/email-templates";

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
  FinalizeAgencyRequestApprovalInput,
  ReviewAgencyRequestInput,
  SubmitAgencyRequestInput,
} from "../models";
import type { AgencyRequestRepo } from "../repository/agency-request.repository";

import { hashPassword } from "../../auth/services/auth.service";
import { makeUserCommandRepository } from "../../users/repository/user-command.repository";
import { makeUserQueryRepository } from "../../users/repository/user-query.repository";
import { makeUserCommandService } from "../../users/services/commands/user.command.service";
import {
  AgencyRequestNotFound as AgencyRequestNotFoundError,
  AgencyRequestNotOwned as AgencyRequestNotOwnedError,
  AgencyRequestRepositoryError as AgencyRequestRepositoryErrorData,
} from "../domain-errors";
import {
  AgencyRequestRepository,
  makeAgencyRequestRepository,
} from "../repository/agency-request.repository";

type AgencyAccountCredentials = {
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly fullName: string;
  readonly role: UserRole;
};

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
  ) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError>;
  approve: (
    agencyRequestId: string,
    input: ApproveAgencyRequestInput,
  ) => Effect.Effect<
    AgencyRequestRow,
    | AgencyRequestRepositoryError
    | AgencyRequestNotFound
    | InvalidAgencyRequestStatusTransition
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
    submit: input => repo.submit(input),
    approve: (agencyRequestId, input) =>
      runPrismaTransaction(client, tx =>
        Effect.gen(function* () {
          const txAgencyRequestRepo = makeAgencyRequestRepository(tx);
          const txAgencyService = makeAgencyService(makeAgencyRepository(tx));
          const txUserCommandService = makeUserCommandService({
            commandRepo: makeUserCommandRepository(tx),
            queryRepo: makeUserQueryRepository(tx),
          });

          const found = yield* txAgencyRequestRepo.findById(agencyRequestId);
          if (Option.isNone(found)) {
            return yield* Effect.fail(
              new AgencyRequestNotFoundError({ agencyRequestId }),
            );
          }

          const agencyRequest = found.value;
          const createdAgency = yield* txAgencyService.create({
            name: agencyRequest.agencyName,
            address: agencyRequest.agencyAddress,
            contactPhone:
              agencyRequest.agencyContactPhone ?? agencyRequest.requesterPhone,
          });

          const credentials = yield* makeAgencyAccountCredentials({
            agencyId: createdAgency.id,
            agencyName: createdAgency.name,
          });

          const passwordHash = yield* hashPassword(credentials.password);
          const createdAgencyUser = yield* txUserCommandService.create({
            fullname: credentials.fullName,
            email: credentials.email,
            passwordHash,
            username: credentials.username,
            role: credentials.role,
            accountStatus: "ACTIVE",
            verify: "VERIFIED",
            orgAssignment: {
              agencyId: createdAgency.id,
            },
          });

          const finalizeApproveInput: FinalizeAgencyRequestApprovalInput = {
            reviewedByUserId: input.reviewedByUserId,
            description: input.description,
            approvedAgencyId: createdAgency.id,
            createdAgencyUserId: createdAgencyUser.id,
          };

          const updatedAgencyRequest = yield* txAgencyRequestRepo.approve(
            agencyRequest.id,
            finalizeApproveInput,
          );

          const approvalEmail = buildAgencyApprovedEmail({
            agencyName: createdAgency.name,
            loginEmail: credentials.email,
            temporaryPassword: credentials.password,
          });

          yield* enqueueOutboxJobInTx(tx, {
            type: JobTypes.EmailSend,
            dedupeKey: `agency-request-approved:${agencyRequest.id}`,
            payload: {
              version: 1,
              kind: "raw",
              to: agencyRequest.requesterEmail,
              subject: approvalEmail.subject,
              html: approvalEmail.html,
            },
            runAt: new Date(),
          });

          return updatedAgencyRequest;
        })).pipe(
        Effect.catchTag("AgencyRepositoryError", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgency",
              cause: err,
            }),
          )),
        Effect.catchTag("UserRepositoryError", err =>
          Effect.fail(
            new AgencyRequestRepositoryErrorData({
              operation: "approve.createAgencyUser",
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

function makeAgencyAccountCredentials(args: {
  agencyId: string;
  agencyName: string;
}): Effect.Effect<AgencyAccountCredentials> {
  return Effect.sync(() => {
    const compactAgencyId = args.agencyId.replace(/-/g, "");
    const username = `agency_${compactAgencyId}`;
    const email = `agency+${compactAgencyId}@accounts.mebike.local`;
    const password = `Mbk!${crypto.randomBytes(12).toString("base64url")}`;

    return {
      email,
      username,
      password,
      fullName: `Agency Admin - ${args.agencyName}`,
      role: "AGENCY",
    } as const;
  });
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
