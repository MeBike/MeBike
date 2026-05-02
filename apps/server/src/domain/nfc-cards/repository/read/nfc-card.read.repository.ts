import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";

import type { NfcCardReadRepo } from "../nfc-card.repository.types";

import { NfcCardRepositoryError } from "../../domain-errors";
import { selectNfcCardRow, toNfcCardRow } from "../nfc-card.mappers";

/**
 * Dựng read repository cho NFC card từ Prisma client hiện tại.
 *
 * Repository này chỉ chịu trách nhiệm đọc và map row persistence sang row
 * domain. Mọi quyết định nghiệp vụ như user có đủ điều kiện hay không sẽ được
 * xử lý ở service layer.
 *
 * @param client Prisma client hoặc transaction client đang thao tác.
 */
export function makeNfcCardReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): NfcCardReadRepo {
  return {
    findById: id =>
      Effect.tryPromise({
        try: () =>
          client.nfcCard.findUnique({
            where: { id },
            select: selectNfcCardRow,
          }),
        catch: cause => new NfcCardRepositoryError({ operation: "findById", cause }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toNfcCardRow))),
        defectOn(NfcCardRepositoryError),
      ),

    findByUid: uid =>
      Effect.tryPromise({
        try: () =>
          client.nfcCard.findUnique({
            where: { uid },
            select: selectNfcCardRow,
          }),
        catch: cause => new NfcCardRepositoryError({ operation: "findByUid", cause }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toNfcCardRow))),
        defectOn(NfcCardRepositoryError),
      ),

    findByAssignedUserId: userId =>
      Effect.tryPromise({
        try: () =>
          client.nfcCard.findFirst({
            where: { assignedUserId: userId },
            select: selectNfcCardRow,
          }),
        catch: cause => new NfcCardRepositoryError({ operation: "findByAssignedUserId", cause }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toNfcCardRow))),
        defectOn(NfcCardRepositoryError),
      ),

    list: filter =>
      Effect.tryPromise({
        try: () =>
          client.nfcCard.findMany({
            where: {
              status: filter.status,
              assignedUserId: filter.assignedUserId,
              ...(filter.uid
                ? {
                    uid: {
                      contains: filter.uid,
                      mode: "insensitive",
                    },
                  }
                : {}),
            },
            orderBy: [
              { createdAt: "desc" },
              { id: "desc" },
            ],
            select: selectNfcCardRow,
          }),
        catch: cause => new NfcCardRepositoryError({ operation: "list", cause }),
      }).pipe(
        Effect.map(rows => rows.map(toNfcCardRow)),
        defectOn(NfcCardRepositoryError),
      ),
  };
}
