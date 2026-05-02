import { Effect, Layer } from "effect";

import type { NfcCardReadRepo } from "../repository/nfc-card.repository.types";
import type { NfcCardQueryService } from "./nfc-card.service.types";

import { NfcCardQueryRepository } from "../repository/nfc-card-query.repository";

/**
 * Tạo query service cho domain thẻ NFC.
 *
 * Service này giữ mỏng có chủ đích: nó gom các nhu cầu tra cứu công khai của
 * domain thẻ và ủy quyền phần đọc dữ liệu cho repository.
 *
 * @param repo Read repository cung cấp dữ liệu thẻ NFC đã được map sang row domain.
 */
export function makeNfcCardQueryService(repo: NfcCardReadRepo): NfcCardQueryService {
  return {
    getById: id => repo.findById(id),
    findByUid: uid => repo.findByUid(uid),
    findByAssignedUserId: userId => repo.findByAssignedUserId(userId),
    list: filter => repo.list(filter),
  };
}

export type { NfcCardQueryService } from "./nfc-card.service.types";

const makeNfcCardQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* NfcCardQueryRepository;
  return makeNfcCardQueryService(repo);
});

export class NfcCardQueryServiceTag extends Effect.Service<NfcCardQueryServiceTag>()(
  "NfcCardQueryService",
  {
    effect: makeNfcCardQueryServiceEffect,
  },
) {}

export const NfcCardQueryServiceLive = Layer.effect(
  NfcCardQueryServiceTag,
  makeNfcCardQueryServiceEffect.pipe(Effect.map(NfcCardQueryServiceTag.make)),
);
