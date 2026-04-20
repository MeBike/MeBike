import { Effect } from "effect";

import type { RentalServiceFailure } from "../../domain-errors";
import type { RentalRow } from "../../models";
import type { FinalizeRentalReturnInput } from "./finalize-rental-return/finalize-rental-return.types";

import { persistFinalizeRentalReturnInTx } from "./finalize-rental-return/finalize-rental-return.persistence";
import { resolveFinalizeRentalReturnPricingInTx } from "./finalize-rental-return/finalize-rental-return.pricing";

export type { FinalizeRentalReturnInput } from "./finalize-rental-return/finalize-rental-return.types";

/**
 * Điều phối flow hoàn tất trả xe trong một transaction duy nhất.
 *
 * Hàm public này chỉ giữ orchestration ở mức cao:
 * tính pricing trước, rồi ghi các side effect sau.
 */
export function finalizeRentalReturnInTx(
  input: FinalizeRentalReturnInput,
): Effect.Effect<RentalRow, RentalServiceFailure> {
  return Effect.gen(function* () {
    const pricing = yield* resolveFinalizeRentalReturnPricingInTx({
      tx: input.tx,
      rental: input.rental,
      endTime: input.endTime,
    });

    return yield* persistFinalizeRentalReturnInTx({
      input,
      pricing,
    });
  });
}
