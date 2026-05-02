import { Effect } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { getPrismaUniqueViolationTarget, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { NfcCardWriteRepo } from "../nfc-card.repository.types";

import {
  DuplicateNfcCardUid,
  NfcCardAlreadyAssigned,
  NfcCardRepositoryError,
  UserAlreadyHasNfcCard,
} from "../../domain-errors";
import { selectNfcCardRow, toNfcCardRow } from "../nfc-card.mappers";

type NfcCardWriteClient = PrismaClient | PrismaTypes.TransactionClient;

function runInTransaction<T>(
  client: NfcCardWriteClient,
  operation: (tx: PrismaTypes.TransactionClient) => Promise<T>,
) {
  if ("$transaction" in client) {
    return client.$transaction(operation);
  }

  return operation(client as PrismaTypes.TransactionClient);
}

function toRepositoryError(operation: string, cause: unknown) {
  return new NfcCardRepositoryError({ operation, cause });
}

function isUidUniqueTarget(target: string | string[] | undefined) {
  const values = Array.isArray(target) ? target : [target];
  return values.some(value => value === "uid" || value === "nfc_cards_uid_key");
}

function isAssignedUserUniqueTarget(target: string | string[] | undefined) {
  const values = Array.isArray(target) ? target : [target];
  return values.some(value => value === "assigned_user_id" || value === "nfc_cards_assigned_user_id_key");
}

/**
 * Dựng write repository cho vòng đời thẻ NFC.
 *
 * Repository này tập trung vào các thay đổi trạng thái cuối cùng trong DB và
 * bảo vệ các bất biến ở mức transaction, ví dụ một user chỉ có tối đa một thẻ
 * được gán tại một thời điểm.
 *
 * @param client Prisma client hoặc transaction client đang thao tác.
 */
export function makeNfcCardWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): NfcCardWriteRepo {
  return {
    create: input =>
      Effect.tryPromise({
        try: () =>
          client.nfcCard.create({
            data: {
              uid: input.uid,
            },
            select: selectNfcCardRow,
          }),
        catch: (cause) => {
          if (isPrismaUniqueViolation(cause) && isUidUniqueTarget(getPrismaUniqueViolationTarget(cause))) {
            return new DuplicateNfcCardUid({ uid: input.uid });
          }

          return toRepositoryError("create", cause);
        },
      }).pipe(
        Effect.map(toNfcCardRow),
        defectOn(NfcCardRepositoryError),
      ),

    assignToUser: input =>
      Effect.tryPromise({
        try: async () => {
          return await runInTransaction(client, async (tx) => {
            const existing = await tx.nfcCard.findUnique({
              where: { id: input.nfcCardId },
              select: {
                id: true,
                uid: true,
                assignedUserId: true,
                issuedAt: true,
              },
            });

            if (!existing) {
              throw new NfcCardRepositoryError({
                operation: "assignToUser.missingCard",
                cause: new Error(`NfcCard not found: ${input.nfcCardId}`),
              });
            }

            if (existing.assignedUserId && existing.assignedUserId !== input.userId) {
              throw new NfcCardAlreadyAssigned({
                nfcCardId: input.nfcCardId,
                assignedUserId: existing.assignedUserId,
              });
            }

            const otherCard = await tx.nfcCard.findFirst({
              where: {
                assignedUserId: input.userId,
                NOT: { id: input.nfcCardId },
              },
              select: { id: true },
            });

            if (otherCard) {
              throw new UserAlreadyHasNfcCard({
                userId: input.userId,
                nfcCardId: otherCard.id,
              });
            }

            const updated = await tx.nfcCard.update({
              where: { id: input.nfcCardId },
              data: {
                assignedUserId: input.userId,
                status: "ACTIVE",
                issuedAt: existing.issuedAt ?? input.now,
                returnedAt: null,
                blockedAt: null,
                lostAt: null,
              },
              select: selectNfcCardRow,
            });
            return updated;
          });
        },
        catch: (cause) => {
          if (cause instanceof NfcCardAlreadyAssigned || cause instanceof UserAlreadyHasNfcCard) {
            return cause;
          }

          if (isPrismaUniqueViolation(cause) && isAssignedUserUniqueTarget(getPrismaUniqueViolationTarget(cause))) {
            return new UserAlreadyHasNfcCard({
              userId: input.userId,
              nfcCardId: input.nfcCardId,
            });
          }

          return toRepositoryError("assignToUser", cause);
        },
      }).pipe(
        Effect.map(toNfcCardRow),
        defectOn(NfcCardRepositoryError),
      ),

    unassign: args =>
      Effect.tryPromise({
        try: async () => {
          return await runInTransaction(client, async (tx) => {
            const existing = await tx.nfcCard.findUnique({
              where: { id: args.nfcCardId },
              select: {
                id: true,
                uid: true,
                assignedUserId: true,
              },
            });

            if (!existing) {
              throw new NfcCardRepositoryError({
                operation: "unassign.missingCard",
                cause: new Error(`NfcCard not found: ${args.nfcCardId}`),
              });
            }

            const updated = await tx.nfcCard.update({
              where: { id: args.nfcCardId },
              data: {
                status: "UNASSIGNED",
                assignedUserId: null,
                returnedAt: args.now,
                blockedAt: null,
                lostAt: null,
              },
              select: selectNfcCardRow,
            });
            return updated;
          });
        },
        catch: cause => toRepositoryError("unassign", cause),
      }).pipe(
        Effect.map(toNfcCardRow),
        defectOn(NfcCardRepositoryError),
      ),

    updateStatus: input =>
      Effect.tryPromise({
        try: async () => {
          return await runInTransaction(client, async (tx) => {
            const existing = await tx.nfcCard.findUnique({
              where: { id: input.nfcCardId },
              select: {
                id: true,
                uid: true,
                assignedUserId: true,
              },
            });

            if (!existing) {
              throw new NfcCardRepositoryError({
                operation: "updateStatus.missingCard",
                cause: new Error(`NfcCard not found: ${input.nfcCardId}`),
              });
            }

            const clearsAssignment = input.status === "LOST" || input.status === "UNASSIGNED";

            const updated = await tx.nfcCard.update({
              where: { id: input.nfcCardId },
              data: {
                status: input.status,
                assignedUserId: clearsAssignment ? null : existing.assignedUserId,
                returnedAt: clearsAssignment ? input.now : null,
                blockedAt: input.status === "BLOCKED" ? input.now : null,
                lostAt: input.status === "LOST" ? input.now : null,
              },
              select: selectNfcCardRow,
            });
            return updated;
          });
        },
        catch: cause => toRepositoryError("updateStatus", cause),
      }).pipe(
        Effect.map(toNfcCardRow),
        defectOn(NfcCardRepositoryError),
      ),
  };
}
