import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type { AgencyRepo } from "../agency.repository.types";

import { AgencyRepositoryError } from "../../domain-errors";
import {
  selectAgencyRow,
  toAgencyOrderBy,
  toAgencyRow,
  toAgencyWhere,
} from "../agency.repository.helpers";

export type AgencyReadRepo = Pick<AgencyRepo, "getById" | "listWithOffset">;

export function makeAgencyReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): AgencyReadRepo {
  return {
    getById(id) {
      return Effect.tryPromise({
        try: () =>
          client.agency.findUnique({
            where: { id },
            select: selectAgencyRow,
          }),
        catch: cause =>
          new AgencyRepositoryError({
            operation: "getById",
            cause,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toAgencyRow))),
      );
    },

    listWithOffset(filter, pageReq) {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);
      const where = toAgencyWhere(filter);
      const orderBy = toAgencyOrderBy(pageReq);

      return Effect.gen(function* () {
        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.agency.count({ where }),
            catch: cause =>
              new AgencyRepositoryError({
                operation: "listWithOffset.count",
                cause,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.agency.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectAgencyRow,
              }),
            catch: cause =>
              new AgencyRepositoryError({
                operation: "listWithOffset.findMany",
                cause,
              }),
          }),
        ]);

        return makePageResult(items.map(toAgencyRow), total, page, pageSize);
      });
    },
  };
}
