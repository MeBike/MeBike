import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { NfcCardReadRepo } from "./nfc-card.repository.types";

import { makeNfcCardReadRepository } from "./read/nfc-card.read.repository";

export type { NfcCardReadRepo } from "./nfc-card.repository.types";

const makeNfcCardQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeNfcCardQueryRepository(client);
});

export class NfcCardQueryRepository extends Effect.Service<NfcCardQueryRepository>()(
  "NfcCardQueryRepository",
  {
    effect: makeNfcCardQueryRepositoryEffect,
  },
) {}

/**
 * Tạo query repository cho NFC card từ Prisma client hiện tại.
 *
 * Entry point này gom toàn bộ truy vấn đọc của domain thẻ NFC để service layer
 * có thể dùng một dependency ổn định.
 *
 * @param client Prisma client hoặc transaction client đang thao tác.
 */
export function makeNfcCardQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): NfcCardReadRepo {
  return makeNfcCardReadRepository(client);
}

export const NfcCardQueryRepositoryLive = Layer.effect(
  NfcCardQueryRepository,
  makeNfcCardQueryRepositoryEffect.pipe(Effect.map(NfcCardQueryRepository.make)),
);
