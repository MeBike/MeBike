import { Effect, Layer } from "effect";

import { ReservationCommandRepository } from "../repository/reservation-command.repository";
import { makeReservationCommandService } from "./commands/reservation.command.service";

export type { ReservationCommandService } from "./reservation.service.types";

const makeReservationCommandServiceEffect = Effect.gen(function* () {
  const repo = yield* ReservationCommandRepository;
  return makeReservationCommandService(repo);
});

export class ReservationCommandServiceTag extends Effect.Service<ReservationCommandServiceTag>()(
  "ReservationCommandService",
  {
    effect: makeReservationCommandServiceEffect,
  },
) {}

export const ReservationCommandServiceLive = Layer.effect(
  ReservationCommandServiceTag,
  makeReservationCommandServiceEffect.pipe(Effect.map(ReservationCommandServiceTag.make)),
);
