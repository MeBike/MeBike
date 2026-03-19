import { Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { isPrismaRecordNotFound } from "@/infrastructure/prisma-errors";
import { AgencyRequestStatus } from "generated/prisma/client";

import type {
  AgencyRequestFilter,
  AgencyRequestRow,
  ApproveAgencyRequestInput,
  ReviewAgencyRequestInput,
  SubmitAgencyRequestInput,
} from "../models";

import {
  AgencyRequestNotFound,
  AgencyRequestRepositoryError,
} from "../domain-errors";
import { selectAgencyRequestRow, toAgencyRequestRow } from "./agency-request.mappers";

export type AgencyRequestRepo = {
  readonly findById: (id: string) => Effect.Effect<Option.Option<AgencyRequestRow>, AgencyRequestRepositoryError>;
  readonly list: (filter?: AgencyRequestFilter) => Effect.Effect<readonly AgencyRequestRow[], AgencyRequestRepositoryError>;
  readonly submit: (input: SubmitAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError>;
  readonly approve: (agencyRequestId: string, input: ApproveAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound>;
  readonly reject: (agencyRequestId: string, input: ReviewAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound>;
  readonly cancel: (agencyRequestId: string, description?: string | null) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound>;
};

const makeAgencyRequestRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeAgencyRequestRepository(client);
});

export class AgencyRequestRepository extends Effect.Service<AgencyRequestRepository>()(
  "AgencyRequestRepository",
  {
    effect: makeAgencyRequestRepositoryEffect,
  },
) {}

export function makeAgencyRequestRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): AgencyRequestRepo {
  const client = db;

  return {
    findById: id =>
      Effect.tryPromise({
        try: () => client.agencyRequest.findUnique({ where: { id }, select: selectAgencyRequestRow }),
        catch: cause => new AgencyRequestRepositoryError({ operation: "findById", cause }),
      }).pipe(Effect.map(row => Option.fromNullable(row).pipe(Option.map(toAgencyRequestRow)))),

    list: (filter = {}) =>
      Effect.tryPromise({
        try: () => client.agencyRequest.findMany({
          where: {
            ...(filter.requesterUserId ? { requesterUserId: filter.requesterUserId } : {}),
            ...(filter.requesterEmail
              ? { requesterEmail: { contains: filter.requesterEmail, mode: "insensitive" as const } }
              : {}),
            ...(filter.status ? { status: filter.status } : {}),
          },
          orderBy: { createdAt: "desc" },
          select: selectAgencyRequestRow,
        }),
        catch: cause => new AgencyRequestRepositoryError({ operation: "list", cause }),
      }).pipe(Effect.map(rows => rows.map(toAgencyRequestRow))),

    submit: input =>
      Effect.tryPromise({
        try: () => client.agencyRequest.create({
          data: {
            requesterUserId: input.requesterUserId ?? null,
            requesterEmail: input.requesterEmail,
            requesterPhone: input.requesterPhone ?? null,
            agencyName: input.agencyName,
            agencyAddress: input.agencyAddress ?? null,
            agencyContactPhone: input.agencyContactPhone ?? null,
            description: input.description ?? null,
          },
          select: selectAgencyRequestRow,
        }),
        catch: cause => new AgencyRequestRepositoryError({ operation: "submit", cause }),
      }).pipe(Effect.map(toAgencyRequestRow)),

    approve: (agencyRequestId, input) =>
      Effect.tryPromise({
        try: () => client.agencyRequest.update({
          where: { id: agencyRequestId },
          data: {
            status: AgencyRequestStatus.APPROVED,
            reviewedByUserId: input.reviewedByUserId,
            reviewedAt: new Date(),
            description: input.description ?? null,
            approvedAgencyId: input.approvedAgencyId,
            createdAgencyUserId: input.createdAgencyUserId,
          },
          select: selectAgencyRequestRow,
        }),
        catch: (cause) => {
          if (isPrismaRecordNotFound(cause)) {
            return new AgencyRequestNotFound({ agencyRequestId });
          }
          return new AgencyRequestRepositoryError({ operation: "approve", cause });
        },
      }).pipe(Effect.map(toAgencyRequestRow)),

    reject: (agencyRequestId, input) =>
      Effect.tryPromise({
        try: () => client.agencyRequest.update({
          where: { id: agencyRequestId },
          data: {
            status: AgencyRequestStatus.REJECTED,
            reviewedByUserId: input.reviewedByUserId,
            reviewedAt: new Date(),
            description: input.description ?? null,
          },
          select: selectAgencyRequestRow,
        }),
        catch: (cause) => {
          if (isPrismaRecordNotFound(cause)) {
            return new AgencyRequestNotFound({ agencyRequestId });
          }
          return new AgencyRequestRepositoryError({ operation: "reject", cause });
        },
      }).pipe(Effect.map(toAgencyRequestRow)),

    cancel: (agencyRequestId, description) =>
      Effect.tryPromise({
        try: () => client.agencyRequest.update({
          where: { id: agencyRequestId },
          data: {
            status: AgencyRequestStatus.CANCELLED,
            description: description ?? null,
          },
          select: selectAgencyRequestRow,
        }),
        catch: (cause) => {
          if (isPrismaRecordNotFound(cause)) {
            return new AgencyRequestNotFound({ agencyRequestId });
          }
          return new AgencyRequestRepositoryError({ operation: "cancel", cause });
        },
      }).pipe(Effect.map(toAgencyRequestRow)),
  };
}

export const AgencyRequestRepositoryLive = Layer.effect(
  AgencyRequestRepository,
  makeAgencyRequestRepositoryEffect.pipe(Effect.map(AgencyRequestRepository.make)),
);
