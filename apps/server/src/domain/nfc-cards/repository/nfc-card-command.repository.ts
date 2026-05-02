import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { NfcCardWriteRepo } from "./nfc-card.repository.types";

import { makeNfcCardWriteRepository } from "./write/nfc-card.write.repository";

export type { NfcCardWriteRepo } from "./nfc-card.repository.types";

const makeNfcCardCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeNfcCardCommandRepository(client);
});

export class NfcCardCommandRepository extends Effect.Service<NfcCardCommandRepository>()(
  "NfcCardCommandRepository",
  {
    effect: makeNfcCardCommandRepositoryEffect,
  },
) {}

/**
 * Tạo command repository cho NFC card từ Prisma client hiện tại.
 *
 * Hàm này là entrypoint chuẩn để service layer ghi dữ liệu thẻ mà không cần
 * biết chi tiết persistence phía dưới.
 *
 * @param client Prisma client hoặc transaction client đang thao tác.
 */
export function makeNfcCardCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): NfcCardWriteRepo {
  return makeNfcCardWriteRepository(client);
}

export const NfcCardCommandRepositoryLive = Layer.effect(
  NfcCardCommandRepository,
  makeNfcCardCommandRepositoryEffect.pipe(Effect.map(NfcCardCommandRepository.make)),
);
