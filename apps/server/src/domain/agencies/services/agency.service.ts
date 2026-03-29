import { Effect, Layer } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { CreateAgencyInput } from "../models";
import type {
  AgencyFilter,
  AgencyRow,
  AgencySortField,
} from "../models";
import type { AgencyRepo } from "../repository/agency.repository";

import { AgencyRepository } from "../repository/agency.repository";

export type AgencyService = {
  readonly listAgencies: (
    filter: AgencyFilter,
    pageReq: PageRequest<AgencySortField>,
  ) => Effect.Effect<PageResult<AgencyRow>>;
  readonly create: (input: CreateAgencyInput) => Effect.Effect<
    AgencyRow,
    import("../domain-errors").AgencyRepositoryError
  >;
};

export function makeAgencyService(repo: AgencyRepo): AgencyService {
  return {
    listAgencies: (filter, pageReq) =>
      repo.listWithOffset(filter, pageReq).pipe(
        Effect.catchTag("AgencyRepositoryError", err => Effect.die(err)),
      ),
    create: input => repo.create(input),
  };
}

const makeAgencyServiceEffect = Effect.gen(function* () {
  const repo = yield* AgencyRepository;
  return makeAgencyService(repo);
});

export class AgencyServiceTag extends Effect.Service<AgencyServiceTag>()(
  "AgencyService",
  {
    effect: makeAgencyServiceEffect,
  },
) {}

export const AgencyServiceLive = Layer.effect(
  AgencyServiceTag,
  makeAgencyServiceEffect.pipe(Effect.map(AgencyServiceTag.make)),
);
