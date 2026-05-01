import { Effect, Layer, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import {
  isWithinOvernightOperationsWindow,
  OVERNIGHT_OPERATIONS_WINDOW_END_LABEL,
  OVERNIGHT_OPERATIONS_WINDOW_START_LABEL,
  VIETNAM_TIME_ZONE,
} from "@/domain/shared/business-hours";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type {
  PricingPolicyReadRepo,
  PricingPolicyWriteRepo,
} from "../repository/pricing-policy.repository.types";
import type {
  CreatePricingPolicyInput,
  PricingPolicyCommandService,
  UpdatePricingPolicyInput,
} from "./pricing-policy.service.types";

import { defectOn } from "../../shared";
import {
  PricingPolicyAlreadyUsed,
  PricingPolicyMutationWindowClosed,
  PricingPolicyNotFound,
} from "../domain-errors";
import { PricingPolicyCommandRepository } from "../repository/pricing-policy-command.repository";
import { PricingPolicyQueryRepository } from "../repository/pricing-policy-query.repository";
import { makePricingPolicyRepository } from "../repository/pricing-policy.repository";

function formatVietnamDateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find(part => part.type === "year")?.value ?? "0000";
  const month = parts.find(part => part.type === "month")?.value ?? "01";
  const day = parts.find(part => part.type === "day")?.value ?? "01";
  const hour = parts.find(part => part.type === "hour")?.value ?? "00";
  const minute = parts.find(part => part.type === "minute")?.value ?? "00";
  const second = parts.find(part => part.type === "second")?.value ?? "00";

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
}

function ensureMutationWindowOpen(now: Date) {
  if (isWithinOvernightOperationsWindow(now)) {
    return Effect.void;
  }

  return Effect.fail(new PricingPolicyMutationWindowClosed({
    currentTime: formatVietnamDateTime(now),
    timeZone: VIETNAM_TIME_ZONE,
    windowStart: OVERNIGHT_OPERATIONS_WINDOW_START_LABEL,
    windowEnd: OVERNIGHT_OPERATIONS_WINDOW_END_LABEL,
  }));
}

export function makePricingPolicyCommandService(args: {
  client: PrismaClient;
  queryRepo: Pick<PricingPolicyReadRepo, "getUsageSummary">;
  commandRepo: Pick<
    PricingPolicyWriteRepo,
    "createPricingPolicy" | "updatePricingPolicy"
  >;
}): PricingPolicyCommandService {
  return {
    createPolicy: (input: CreatePricingPolicyInput) =>
      Effect.gen(function* () {
        const now = input.now ?? new Date();
        yield* ensureMutationWindowOpen(now);

        return yield* args.commandRepo.createPricingPolicy({
          name: input.name.trim(),
          baseRate: input.baseRate,
          billingUnitMinutes: input.billingUnitMinutes,
          reservationFee: input.reservationFee,
          depositRequired: input.depositRequired,
          lateReturnCutoff: input.lateReturnCutoff,
          status: "INACTIVE",
          updatedAt: now,
        });
      }),

    updatePolicy: (input: UpdatePricingPolicyInput) =>
      Effect.gen(function* () {
        const now = input.now ?? new Date();
        yield* ensureMutationWindowOpen(now);

        const usage = yield* args.queryRepo.getUsageSummary(input.pricingPolicyId);
        if (usage.isUsed) {
          return yield* Effect.fail(new PricingPolicyAlreadyUsed({
            pricingPolicyId: input.pricingPolicyId,
            reservationCount: usage.reservationCount,
            rentalCount: usage.rentalCount,
            billingRecordCount: usage.billingRecordCount,
          }));
        }

        const updatedOpt = yield* args.commandRepo.updatePricingPolicy({
          pricingPolicyId: input.pricingPolicyId,
          name: input.name?.trim(),
          baseRate: input.baseRate,
          billingUnitMinutes: input.billingUnitMinutes,
          reservationFee: input.reservationFee,
          depositRequired: input.depositRequired,
          lateReturnCutoff: input.lateReturnCutoff,
          updatedAt: now,
        });

        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new PricingPolicyNotFound({
            pricingPolicyId: input.pricingPolicyId,
          }));
        }

        return updatedOpt.value;
      }),

    activatePolicy: (pricingPolicyId, now = new Date()) =>
      Effect.gen(function* () {
        yield* ensureMutationWindowOpen(now);

        return yield* runPrismaTransaction(args.client, tx =>
          Effect.gen(function* () {
            const txRepo = makePricingPolicyRepository(tx);

            yield* txRepo.getById(pricingPolicyId);
            yield* txRepo.deactivateActivePolicies({
              excludePricingPolicyId: pricingPolicyId,
              updatedAt: now,
            });

            const activatedOpt = yield* txRepo.updatePricingPolicyStatus({
              pricingPolicyId,
              status: "ACTIVE",
              updatedAt: now,
            });

            if (Option.isNone(activatedOpt)) {
              return yield* Effect.fail(new PricingPolicyNotFound({ pricingPolicyId }));
            }

            return activatedOpt.value;
          })).pipe(defectOn(PrismaTransactionError));
      }),
  };
}

export type { PricingPolicyCommandService } from "./pricing-policy.service.types";

const makePricingPolicyCommandServiceEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  const queryRepo = yield* PricingPolicyQueryRepository;
  const commandRepo = yield* PricingPolicyCommandRepository;

  return makePricingPolicyCommandService({
    client,
    queryRepo,
    commandRepo,
  });
});

export class PricingPolicyCommandServiceTag extends Effect.Service<PricingPolicyCommandServiceTag>()(
  "PricingPolicyCommandService",
  {
    effect: makePricingPolicyCommandServiceEffect,
  },
) {}

export const PricingPolicyCommandServiceLive = Layer.effect(
  PricingPolicyCommandServiceTag,
  makePricingPolicyCommandServiceEffect.pipe(Effect.map(PricingPolicyCommandServiceTag.make)),
);
