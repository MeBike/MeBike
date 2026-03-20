import { Effect, Layer, Option } from "effect";

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

function makeAgencyRequestService(repo: AgencyRequestRepo): AgencyRequestService {
  return {
    getById: id => repo.findById(id),
    list: filter => repo.list(filter),
    submit: input => repo.submit(input),
    approve: (agencyRequestId, input) => repo.approve(agencyRequestId, input),
    reject: (agencyRequestId, input) => repo.reject(agencyRequestId, input),
    cancel: (agencyRequestId, description) => repo.cancel(agencyRequestId, description),
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
