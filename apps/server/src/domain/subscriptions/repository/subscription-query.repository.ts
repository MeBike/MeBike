import { Effect, Layer, Option } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type { SubscriptionSortField } from "../models";
import type { SubscriptionQueryRepo } from "./subscription.repository.types";

import { SubscriptionRepositoryError } from "../domain-errors";
import {
  selectAdminSubscriptionRow,
  selectSubscriptionRow,
  toAdminSubscriptionRow,
  toSubscriptionRow,
} from "./subscription.mappers";

/**
 * Chuẩn hóa sort field bên ngoài thành `orderBy` của Prisma.
 * Mọi list query nên đi qua đây để giữ thứ tự map field ở một chỗ.
 */
function toSubscriptionOrderBy(
  req: PageRequest<SubscriptionSortField>,
): PrismaTypes.SubscriptionOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "updatedAt";
  const sortDir = req.sortDir ?? "desc";
  switch (sortBy) {
    case "expiresAt":
      return { expiresAt: sortDir };
    case "status":
      return { status: sortDir };
    case "activatedAt":
      return { activatedAt: sortDir };
    case "packageName":
      return { packageName: sortDir };
    case "updatedAt":
    default:
      return { updatedAt: sortDir };
  }
}

/**
 * Tạo query repository cho subscriptions từ Prisma client hoặc transaction client.
 * Cùng một factory này được dùng ở cả scope thường lẫn scope transaction.
 */
export function makeSubscriptionQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): SubscriptionQueryRepo {
  return {
    findById: subscriptionId =>
      Effect.tryPromise({
        try: () =>
          client.subscription.findUnique({
            where: { id: subscriptionId },
            select: selectSubscriptionRow,
          }),
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toSubscriptionRow))),
        defectOn(SubscriptionRepositoryError),
      ),

    findAdminById: subscriptionId =>
      Effect.tryPromise({
        try: () =>
          client.subscription.findUnique({
            where: { id: subscriptionId },
            select: selectAdminSubscriptionRow,
          }),
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "findAdminById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toAdminSubscriptionRow))),
        defectOn(SubscriptionRepositoryError),
      ),

    findCurrentForUser: (userId, statuses) =>
      Effect.tryPromise({
        try: () =>
          client.subscription.findFirst({
            where: {
              userId,
              status: { in: [...statuses] },
            },
            orderBy: { updatedAt: "desc" },
            select: selectSubscriptionRow,
          }),
        catch: err =>
          new SubscriptionRepositoryError({
            operation: "findCurrentForUser",
            message: `Failed to find current subscription for user ${userId}`,
            cause: err,
          }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toSubscriptionRow))),
        defectOn(SubscriptionRepositoryError),
      ),

    listForUser: (userId, filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.SubscriptionWhereInput = {
          userId,
          ...(filter.status ? { status: filter.status } : {}),
        };

        const orderBy = toSubscriptionOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.subscription.count({ where }),
            catch: err =>
              new SubscriptionRepositoryError({
                operation: "listForUser.count",
                message: `Failed to count subscriptions for user ${userId}`,
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.subscription.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectSubscriptionRow,
              }),
            catch: err =>
              new SubscriptionRepositoryError({
                operation: "listForUser.findMany",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(items.map(toSubscriptionRow), total, page, pageSize);
      }).pipe(defectOn(SubscriptionRepositoryError)),

    listAll: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.SubscriptionWhereInput = {
          ...(filter.status ? { status: filter.status } : {}),
        };

        const orderBy = toSubscriptionOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.subscription.count({ where }),
            catch: err =>
              new SubscriptionRepositoryError({
                operation: "listAll.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.subscription.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectAdminSubscriptionRow,
              }),
            catch: err =>
              new SubscriptionRepositoryError({
                operation: "listAll.findMany",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(items.map(toAdminSubscriptionRow), total, page, pageSize);
      }).pipe(defectOn(SubscriptionRepositoryError)),
  };
}

const makeSubscriptionQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeSubscriptionQueryRepository(client);
});

export class SubscriptionQueryRepository extends Effect.Service<SubscriptionQueryRepository>()(
  "SubscriptionQueryRepository",
  {
    effect: makeSubscriptionQueryRepositoryEffect,
  },
) {}

export const SubscriptionQueryRepositoryLive = Layer.effect(
  SubscriptionQueryRepository,
  makeSubscriptionQueryRepositoryEffect.pipe(Effect.map(SubscriptionQueryRepository.make)),
);
