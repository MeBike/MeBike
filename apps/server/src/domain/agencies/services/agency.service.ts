import { Effect, Layer } from "effect";

import type { CreateAgencyInput } from "../models";
import type { AgencyRow } from "../models";
import type { AgencyRepo } from "../repository/agency.repository";

import { AgencyRepository } from "../repository/agency.repository";

export type AgencyService = {
  readonly create: (input: CreateAgencyInput) => Effect.Effect<
    AgencyRow,
    import("../domain-errors").AgencyRepositoryError
  >;
};

export function makeAgencyService(repo: AgencyRepo): AgencyService {
  return {
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
