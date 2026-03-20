import { Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { AgencyRequestStatus } from "generated/prisma/client";

import type {
  InvalidAgencyRequestStatusTransition,
} from "../domain-errors";
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
  InvalidAgencyRequestStatusTransition as InvalidAgencyRequestStatusTransitionError,
} from "../domain-errors";
import { selectAgencyRequestRow, toAgencyRequestRow } from "./agency-request.mappers";

export type AgencyRequestRepo = {
  readonly findById: (id: string) => Effect.Effect<Option.Option<AgencyRequestRow>, AgencyRequestRepositoryError>;
  readonly list: (filter?: AgencyRequestFilter) => Effect.Effect<readonly AgencyRequestRow[], AgencyRequestRepositoryError>;
  readonly submit: (input: SubmitAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError>;
  readonly approve: (agencyRequestId: string, input: ApproveAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition>;
  readonly reject: (agencyRequestId: string, input: ReviewAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition>;
  readonly cancel: (agencyRequestId: string, description?: string | null) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition>;
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

  const runInTransaction = <T>(
    execute: (tx: PrismaTypes.TransactionClient) => Promise<T>,
  ) => {
    if ("$transaction" in client) {
      return client.$transaction(tx => execute(tx));
    }

    return execute(client);
  };

  function updateIfPending(
    args: {
      agencyRequestId: string;
      nextStatus: AgencyRequestStatus;
      operation: "approve" | "reject" | "cancel";
      data: PrismaTypes.AgencyRequestUncheckedUpdateManyInput;
    },
  ): Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition> {
    return Effect.tryPromise({
      try: async () => {
        return runInTransaction(async (tx) => {
          const updateResult = await tx.agencyRequest.updateMany({
            where: {
              id: args.agencyRequestId,
              status: AgencyRequestStatus.PENDING,
            },
            data: args.data,
          });

          if (updateResult.count === 1) {
            const updated = await tx.agencyRequest.findUnique({
              where: { id: args.agencyRequestId },
              select: selectAgencyRequestRow,
            });

            if (!updated) {
              throw new AgencyRequestNotFound({ agencyRequestId: args.agencyRequestId });
            }

            return updated;
          }

          const existing = await tx.agencyRequest.findUnique({
            where: { id: args.agencyRequestId },
            select: {
              id: true,
              status: true,
            },
          });

          if (!existing) {
            throw new AgencyRequestNotFound({ agencyRequestId: args.agencyRequestId });
          }

          throw new InvalidAgencyRequestStatusTransitionError({
            agencyRequestId: existing.id,
            currentStatus: existing.status,
            nextStatus: args.nextStatus,
          });
        });
      },
      catch: (cause) => {
        if (cause instanceof AgencyRequestNotFound || cause instanceof InvalidAgencyRequestStatusTransitionError) {
          return cause;
        }

        return new AgencyRequestRepositoryError({ operation: args.operation, cause });
      },
    }).pipe(Effect.map(toAgencyRequestRow));
  }

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
      updateIfPending({
        agencyRequestId,
        nextStatus: AgencyRequestStatus.APPROVED,
        operation: "approve",
        data: {
          status: AgencyRequestStatus.APPROVED,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: new Date(),
          description: input.description ?? null,
          approvedAgencyId: input.approvedAgencyId,
          createdAgencyUserId: input.createdAgencyUserId,
        },
      }),

    reject: (agencyRequestId, input) =>
      updateIfPending({
        agencyRequestId,
        nextStatus: AgencyRequestStatus.REJECTED,
        operation: "reject",
        data: {
          status: AgencyRequestStatus.REJECTED,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: new Date(),
          description: input.description ?? null,
        },
      }),

    cancel: (agencyRequestId, description) =>
      updateIfPending({
        agencyRequestId,
        nextStatus: AgencyRequestStatus.CANCELLED,
        operation: "cancel",
        data: {
          status: AgencyRequestStatus.CANCELLED,
          description: description ?? null,
        },
      }),
  };
}

export const AgencyRequestRepositoryLive = Layer.effect(
  AgencyRequestRepository,
  makeAgencyRequestRepositoryEffect.pipe(Effect.map(AgencyRequestRepository.make)),
);
