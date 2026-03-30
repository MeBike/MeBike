import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type { AdminRentalListItem } from "../../models";
import type { RentalRepo } from "../rental.repository.types";

import { RentalRepositoryError } from "../../domain-errors";
import {
  adminRentalDetailSelect,
  adminRentalListSelect,
  mapToAdminRentalDetail,
  mapToAdminRentalListItem,
} from "../rental.repository.admin.query";
import { toAdminRentalsWhere, toRentalOrderBy } from "../rental.repository.query";

export type RentalAdminReadRepo = Pick<
  RentalRepo,
  "adminListRentals" | "adminGetRentalById" | "listActiveRentalsByPhone"
>;

export function makeRentalAdminReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalAdminReadRepo {
  return {
    adminListRentals(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toAdminRentalsWhere(filter);
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "adminListRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select: adminRentalListSelect,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "adminListRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: AdminRentalListItem[] = items.map(
          mapToAdminRentalListItem,
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    adminGetRentalById(rentalId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findUnique({
              where: { id: rentalId },
              select: adminRentalDetailSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "adminGetRentalById",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.some(mapToAdminRentalDetail(raw));
      });
    },

    listActiveRentalsByPhone(phoneNumber, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toRentalOrderBy(pageReq);

        const where = {
          status: "RENTED",
          user: { phoneNumber },
        } satisfies PrismaTypes.RentalWhereInput;

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "listActiveRentalsByPhone.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select: adminRentalListSelect,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "listActiveRentalsByPhone.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: AdminRentalListItem[] = items.map(
          mapToAdminRentalListItem,
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },
  };
}
