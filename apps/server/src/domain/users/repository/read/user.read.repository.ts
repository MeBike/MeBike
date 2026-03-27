import { Effect, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { UserRole } from "generated/prisma/client";

import type { UserRepo } from "../user.repository.types";

import { makePageResult, normalizedPage } from "../../../shared/pagination";
import { UserRepositoryError } from "../../domain-errors";
import { selectUserRow, toUserRow } from "../user.mappers";
import {
  countTechnicianTeamMembersForClient,
  toOrderBy,
  toWhere,
} from "../user.repository.helpers";

export type UserReadRepo = Pick<
  UserRepo,
  | "findById"
  | "findByEmail"
  | "findByStripeConnectedAccountId"
  | "listWithOffset"
  | "searchByQuery"
  | "listTechnicianSummaries"
  | "countTechnicianTeamMembers"
>;

export function makeUserReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserReadRepo {
  return {
    findById: id =>
      Effect.tryPromise({
        try: () =>
          client.user.findUnique({
            where: { id },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    findByEmail: email =>
      Effect.tryPromise({
        try: () =>
          client.user.findUnique({
            where: { email },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "findByEmail",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    findByStripeConnectedAccountId: accountId =>
      Effect.tryPromise({
        try: () =>
          client.user.findUnique({
            where: { stripeConnectedAccountId: accountId },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "findByStripeConnectedAccountId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    listWithOffset: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const where = toWhere(filter);
        const orderBy = toOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.user.count({ where }),
            catch: err =>
              new UserRepositoryError({
                operation: "listWithOffset.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.user.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectUserRow,
              }),
            catch: err =>
              new UserRepositoryError({
                operation: "listWithOffset.findMany",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(
          items.map(toUserRow),
          total,
          page,
          pageSize,
        );
      }),

    searchByQuery: query =>
      Effect.tryPromise({
        try: () =>
          client.user.findMany({
            where: {
              OR: [
                { email: { contains: query, mode: "insensitive" } },
                { phoneNumber: { contains: query } },
              ],
            },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "searchByQuery",
            cause: err,
          }),
      }).pipe(Effect.map(rows => rows.map(toUserRow))),

    listTechnicianSummaries: () =>
      Effect.tryPromise({
        try: () =>
          client.user.findMany({
            where: {
              role: UserRole.TECHNICIAN,
            },
            orderBy: {
              fullName: "asc",
            },
            select: {
              id: true,
              fullName: true,
            },
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "listTechnicianSummaries",
            cause: err,
          }),
      }).pipe(
        Effect.map(rows => rows.map(row => ({
          id: row.id,
          fullname: row.fullName,
        }))),
      ),

    countTechnicianTeamMembers: (technicianTeamId, options) =>
      countTechnicianTeamMembersForClient(client, technicianTeamId, options),
  };
}
