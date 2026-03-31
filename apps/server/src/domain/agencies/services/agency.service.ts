import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { AgencyFilter, AgencyRow, AgencySortField, CreateAgencyInput, UpdateAgencyInput, UpdateAgencyStatusInput } from "../models";
import type { AgencyRepo } from "../repository/agency.repository";

import { AgencyNotFound } from "../domain-errors";
import { AgencyRepository } from "../repository/agency.repository";

export type AgencyService = {
  readonly getAgencyById: (id: string) => Effect.Effect<AgencyRow, AgencyNotFound>;
  readonly listAgencies: (
    filter: AgencyFilter,
    pageReq: PageRequest<AgencySortField>,
  ) => Effect.Effect<PageResult<AgencyRow>>;
  readonly create: (input: CreateAgencyInput) => Effect.Effect<
    AgencyRow,
    import("../domain-errors").AgencyRepositoryError
  >;
  readonly updateAgency: (
    id: string,
    input: UpdateAgencyInput,
  ) => Effect.Effect<AgencyRow, AgencyNotFound>;
  readonly updateAgencyStatus: (
    id: string,
    input: UpdateAgencyStatusInput,
  ) => Effect.Effect<AgencyRow, AgencyNotFound>;
};

export function makeAgencyService(repo: AgencyRepo): AgencyService {
  return {
    getAgencyById: id =>
      Effect.gen(function* () {
        const agencyOpt = yield* repo.getById(id).pipe(
          Effect.catchTag("AgencyRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(agencyOpt)) {
          return yield* Effect.fail(new AgencyNotFound({ id }));
        }

        return agencyOpt.value;
      }),
    listAgencies: (filter, pageReq) =>
      repo.listWithOffset(filter, pageReq).pipe(
        Effect.catchTag("AgencyRepositoryError", err => Effect.die(err)),
      ),
    create: input => repo.create(input),
    updateAgency: (id, input) =>
      Effect.gen(function* () {
        const updatedOpt = yield* repo.update(id, input).pipe(
          Effect.catchTag("AgencyRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new AgencyNotFound({ id }));
        }

        return updatedOpt.value;
      }),
    updateAgencyStatus: (id, input) =>
      Effect.gen(function* () {
        const updatedOpt = yield* repo.updateStatus(id, input).pipe(
          Effect.catchTag("AgencyRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new AgencyNotFound({ id }));
        }

        return updatedOpt.value;
      }),
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
