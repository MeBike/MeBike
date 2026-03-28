import { Effect, Layer, Option } from "effect";

import type { PageResult } from "@/domain/shared/pagination";

import type {
  AgencyRequestNotFound,
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

import { AgencyRequestNotFound as AgencyRequestNotFoundError } from "../domain-errors";
import { AgencyRequestRepository } from "../repository/agency-request.repository";

export type AgencyRequestService = {
  getById: (id: string) => Effect.Effect<Option.Option<AgencyRequestRow>, AgencyRequestRepositoryError>;
  getByIdOrFail: (
    id: string,
  ) => Effect.Effect<AgencyRequestRow, AgencyRequestRepositoryError | AgencyRequestNotFound>;
  list: (filter?: AgencyRequestFilter) => Effect.Effect<readonly AgencyRequestRow[], AgencyRequestRepositoryError>;
  listWithOffset: (
    filter: AgencyRequestFilter,
    pageReq: AgencyRequestPageRequest,
  ) => Effect.Effect<PageResult<AgencyRequestRow>, AgencyRequestRepositoryError>;
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
    getByIdOrFail: id =>
      Effect.gen(function* () {
        const found = yield* repo.findById(id);
        if (Option.isNone(found)) {
          return yield* Effect.fail(new AgencyRequestNotFoundError({ agencyRequestId: id }));
        }
        return found.value;
      }),
    list: filter => repo.list(filter),
    listWithOffset: (filter, pageReq) => repo.listWithOffset(filter, pageReq),
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
