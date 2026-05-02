import { Effect, Layer, Option } from "effect";

import type { NfcCardStatus } from "generated/prisma/client";

import type { UserQueryRepo } from "../../users/repository/user.repository.types";
import type {
  NfcCardReadRepo,
  NfcCardWriteRepo,
} from "../repository/nfc-card.repository.types";
import type { NfcCardCommandService } from "./nfc-card.service.types";

import { UserQueryRepository } from "../../users/repository/user-query.repository";
import {
  NfcCardAlreadyAssigned,
  NfcCardAssigneeNotFound,
  NfcCardInvalidState,
  NfcCardNotFound,
  NfcCardUserNotEligible,
  UserAlreadyHasNfcCard,
} from "../domain-errors";
import { NfcCardCommandRepository } from "../repository/nfc-card-command.repository";
import { NfcCardQueryRepository } from "../repository/nfc-card-query.repository";

function failInvalidState(nfcCardId: string, status: NfcCardStatus, message: string) {
  return Effect.fail(new NfcCardInvalidState({ nfcCardId, status, message }));
}

/**
 * Tạo command service cho domain thẻ NFC.
 *
 * Service này giữ toàn bộ rule nghiệp vụ quan trọng của thẻ: user nào được
 * phép nhận thẻ, trạng thái nào còn được gán, khi nào phải trả thẻ về kho, và
 * khi nào việc kích hoạt lại bị chặn.
 *
 * @param args Các dependency nghiệp vụ cần thiết để đọc thẻ hiện tại, ghi thay
 * đổi vòng đời thẻ, và kiểm tra user đích có đủ điều kiện sử dụng NFC hay không.
 * @param args.commandRepo Repository ghi cho các thay đổi vòng đời thẻ.
 * @param args.queryRepo Repository đọc để tra cứu trạng thái thẻ hiện tại.
 * @param args.userQueryRepo Repository đọc user dùng để kiểm tra điều kiện cấp thẻ.
 */
export function makeNfcCardCommandService(args: {
  commandRepo: NfcCardWriteRepo;
  queryRepo: NfcCardReadRepo;
  userQueryRepo: Pick<UserQueryRepo, "findById">;
}): NfcCardCommandService {
  const { commandRepo, queryRepo, userQueryRepo } = args;

  /**
   * Kiểm tra user có còn đủ điều kiện sử dụng NFC hay không.
   *
   * User phải tồn tại, đã xác minh, và không ở trạng thái bị cấm. Hàm này được
   * tái dùng ở các flow gán thẻ và kích hoạt lại thẻ.
   */
  const ensureEligibleUser = (userId: string) =>
    Effect.gen(function* () {
      const userOpt = yield* userQueryRepo.findById(userId);
      if (Option.isNone(userOpt)) {
        return yield* Effect.fail(new NfcCardAssigneeNotFound({ userId }));
      }

      const user = userOpt.value;
      if (user.verify !== "VERIFIED") {
        return yield* Effect.fail(new NfcCardUserNotEligible({ userId, reason: "UNVERIFIED" }));
      }

      if (user.accountStatus === "BANNED") {
        return yield* Effect.fail(new NfcCardUserNotEligible({ userId, reason: "BANNED" }));
      }

      return user;
    });

  return {
    createCard: input => commandRepo.create({ uid: input.uid.trim() }),

    assignCard: input =>
      Effect.gen(function* () {
        yield* ensureEligibleUser(input.userId);

        const cardOpt = yield* queryRepo.findById(input.nfcCardId);
        if (Option.isNone(cardOpt)) {
          return yield* Effect.fail(new NfcCardNotFound({ nfcCardId: input.nfcCardId }));
        }

        const card = cardOpt.value;
        if (card.status === "LOST") {
          return yield* failInvalidState(
            card.id,
            card.status,
            `${card.status} cards cannot be assigned`,
          );
        }
        // nếu thẻ đã được gán cho một user khác,
        if (card.assignedUserId && card.assignedUserId !== input.userId) {
          return yield* Effect.fail(new NfcCardAlreadyAssigned({
            nfcCardId: card.id,
            assignedUserId: card.assignedUserId,
          }));
        }
        // nếu user đã có thẻ khác được gán,
        const existingUserCardOpt = yield* queryRepo.findByAssignedUserId(input.userId);

        if (Option.isSome(existingUserCardOpt) && existingUserCardOpt.value.id !== card.id) {
          return yield* Effect.fail(new UserAlreadyHasNfcCard({
            userId: input.userId,
            nfcCardId: existingUserCardOpt.value.id,
          }));
        }

        return yield* commandRepo.assignToUser(input);
      }),

    unassignCard: args =>
      Effect.gen(function* () {
        const cardOpt = yield* queryRepo.findById(args.nfcCardId);
        if (Option.isNone(cardOpt)) {
          return yield* Effect.fail(new NfcCardNotFound({ nfcCardId: args.nfcCardId }));
        }

        return yield* commandRepo.unassign(args);
      }),

    updateStatus: input =>
      Effect.gen(function* () {
        const cardOpt = yield* queryRepo.findById(input.nfcCardId);
        if (Option.isNone(cardOpt)) {
          return yield* Effect.fail(new NfcCardNotFound({ nfcCardId: input.nfcCardId }));
        }

        const card = cardOpt.value;

        if (input.status === "ACTIVE") {
          if (!card.assignedUserId || !card.assignedUser) {
            return yield* failInvalidState(card.id, card.status, "Cannot activate a card without an assigned user");
          }

          yield* ensureEligibleUser(card.assignedUserId);
        }

        if (card.status === "LOST" && input.status === "ACTIVE") {
          return yield* failInvalidState(card.id, card.status, "Lost cards cannot be reactivated directly");
        }

        if (input.status === "UNASSIGNED") {
          return yield* commandRepo.unassign({ nfcCardId: input.nfcCardId, now: input.now });
        }

        return yield* commandRepo.updateStatus(input);
      }),
  };
}

export type { NfcCardCommandService } from "./nfc-card.service.types";

const makeNfcCardCommandServiceEffect = Effect.gen(function* () {
  const commandRepo = yield* NfcCardCommandRepository;
  const queryRepo = yield* NfcCardQueryRepository;
  const userQueryRepo = yield* UserQueryRepository;

  return makeNfcCardCommandService({
    commandRepo,
    queryRepo,
    userQueryRepo,
  });
});

export class NfcCardCommandServiceTag extends Effect.Service<NfcCardCommandServiceTag>()(
  "NfcCardCommandService",
  {
    effect: makeNfcCardCommandServiceEffect,
  },
) {}

export const NfcCardCommandServiceLive = Layer.effect(
  NfcCardCommandServiceTag,
  makeNfcCardCommandServiceEffect.pipe(Effect.map(NfcCardCommandServiceTag.make)),
);
