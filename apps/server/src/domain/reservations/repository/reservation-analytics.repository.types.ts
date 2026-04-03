import type { Effect } from "effect";

import type { ReservationRepositoryError } from "../domain-errors";
import type { ReservationCountsRow } from "../models";

export type ReservationAnalyticsRepo = {
  getGlobalReservationCounts: () => Effect.Effect<readonly ReservationCountsRow[], ReservationRepositoryError>;
};
