import { Effect, Layer } from "effect";

import { ReservationQueryRepository } from "../repository/reservation-query.repository";
import { makeReservationQueryService } from "./queries/reservation.query.service";

export type { ReservationQueryService } from "./reservation.service.types";

const makeReservationQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* ReservationQueryRepository;
  return makeReservationQueryService(repo);
});

export class ReservationQueryServiceTag extends Effect.Service<ReservationQueryServiceTag>()(
  "ReservationQueryService",
  {
    effect: makeReservationQueryServiceEffect,
  },
) {}

export const ReservationQueryServiceLive = Layer.effect(
  ReservationQueryServiceTag,
  makeReservationQueryServiceEffect.pipe(Effect.map(ReservationQueryServiceTag.make)),
);
