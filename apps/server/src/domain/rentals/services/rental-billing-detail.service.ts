import { Effect, Layer, Option } from "effect";

import type { RentalBillingDetailRow } from "../models";
import type { RentalRepo } from "../repository/rental.repository";

import {
  BillingDetailNotReady,
  BillingDetailRequiresCompletedRental,
  RentalNotFound,
} from "../domain-errors";
import { RentalRepository } from "../repository/rental.repository";

type RentalBillingDetailInput = {
  readonly rentalId: string;
  readonly userId: string;
};

export type RentalBillingDetailService = {
  getForUser: (
    input: RentalBillingDetailInput,
  ) => Effect.Effect<
    RentalBillingDetailRow,
    RentalNotFound
    | BillingDetailRequiresCompletedRental
    | BillingDetailNotReady
  >;
};

function makeRentalBillingDetailService(
  repo: RentalRepo,
): RentalBillingDetailService {
  return {
    getForUser: input =>
      Effect.gen(function* () {
        const rentalOpt = yield* repo.getMyRentalById(input.userId, input.rentalId);

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const rental = rentalOpt.value;
        if (rental.status !== "COMPLETED") {
          return yield* Effect.fail(new BillingDetailRequiresCompletedRental({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        const detailOpt = yield* repo.getMyRentalBillingDetail(
          input.userId,
          input.rentalId,
        );

        if (Option.isNone(detailOpt)) {
          return yield* Effect.fail(new BillingDetailNotReady({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        return detailOpt.value;
      }),
  };
}

const makeRentalBillingDetailServiceEffect = Effect.gen(function* () {
  const repo = yield* RentalRepository;
  return makeRentalBillingDetailService(repo);
});

export class RentalBillingDetailServiceTag extends Effect.Service<RentalBillingDetailServiceTag>()(
  "RentalBillingDetailService",
  {
    effect: makeRentalBillingDetailServiceEffect,
  },
) {}

export const RentalBillingDetailServiceLive = Layer.effect(
  RentalBillingDetailServiceTag,
  makeRentalBillingDetailServiceEffect.pipe(
    Effect.map(RentalBillingDetailServiceTag.make),
  ),
);
