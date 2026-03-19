import { Effect, Layer, Option } from "effect";

import { AgencyRequestStatus } from "generated/prisma/client";

import type {
  AgencyRequestNotFound,
  AgencyRequestRepositoryError,
  InvalidAgencyRequestStatusTransition,
} from "../domain-errors";
import type {
  AgencyRequestFilter,
  AgencyRequestRow,
  ApproveAgencyRequestInput,
  ReviewAgencyRequestInput,
  SubmitAgencyRequestInput,
} from "../models";
import type { AgencyRequestRepo } from "../repository/agency-request.repository";

import {
  InvalidAgencyRequestStatusTransition as InvalidAgencyRequestStatusTransitionError,
} from "../domain-errors";
import { AgencyRequestRepository } from "../repository/agency-request.repository";

export type AgencyRequestService = {
  getById: (id: string) => Effect.Effect<Option.Option<AgencyRequestRow>, AgencyRequestRepositoryError>;
  list: (filter?: AgencyRequestFilter) => Effect.Effect<readonly AgencyRequestRow[], AgencyRequestRepositoryError>;
  submit: (input: SubmitAgencyRequestInput) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError>;
  approve: (
    agencyRequestId: string,
    input: ApproveAgencyRequestInput,
  ) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition>;
  reject: (
    agencyRequestId: string,
    input: ReviewAgencyRequestInput,
  ) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition>;
  cancel: (
    agencyRequestId: string,
    description?: string | null,
  ) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound | InvalidAgencyRequestStatusTransition>;
};

function ensurePending(
  agencyRequest: AgencyRequestRow,
  nextStatus: AgencyRequestStatus,
): Effect.Effect<void, InvalidAgencyRequestStatusTransition> {
  if (agencyRequest.status === AgencyRequestStatus.PENDING) {
    return Effect.void;
  }

  return Effect.fail(new InvalidAgencyRequestStatusTransitionError({
    agencyRequestId: agencyRequest.id,
    currentStatus: agencyRequest.status,
    nextStatus,
  }));
}

function makeAgencyRequestService(repo: AgencyRequestRepo): AgencyRequestService {
  return {
    getById: id => repo.findById(id),
    list: filter => repo.list(filter),
    submit: input => repo.submit(input),

    approve: (agencyRequestId, input) =>
      Effect.gen(function* () {
        const existing = yield* repo.findById(agencyRequestId);
        if (Option.isNone(existing)) {
          return yield* repo.approve(agencyRequestId, input);
        }

        yield* ensurePending(existing.value, AgencyRequestStatus.APPROVED);
        return yield* repo.approve(agencyRequestId, input);
      }),

    reject: (agencyRequestId, input) =>
      Effect.gen(function* () {
        const existing = yield* repo.findById(agencyRequestId);
        if (Option.isNone(existing)) {
          return yield* repo.reject(agencyRequestId, input);
        }

        yield* ensurePending(existing.value, AgencyRequestStatus.REJECTED);
        return yield* repo.reject(agencyRequestId, input);
      }),

    cancel: (agencyRequestId, description) =>
      Effect.gen(function* () {
        const existing = yield* repo.findById(agencyRequestId);
        if (Option.isNone(existing)) {
          return yield* repo.cancel(agencyRequestId, description);
        }

        yield* ensurePending(existing.value, AgencyRequestStatus.CANCELLED);
        return yield* repo.cancel(agencyRequestId, description);
      }),
  };
}

const makeAgencyRequestServiceEffect = Effect.gen(function* () {
  const repo = yield* AgencyRequestRepository;
  return makeAgencyRequestService(repo);
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
