import { Layer } from "effect";

import { AiChatServiceLive } from "@/domain/ai";

import { RentalServiceLayer } from "./rental.layers";
import { ReservationQueryServiceLayer } from "./reservation.layers";
import { WalletServiceLayer } from "./wallet.layers";

export const AiServiceLayer = AiChatServiceLive.pipe(
  Layer.provide(WalletServiceLayer),
  Layer.provide(ReservationQueryServiceLayer),
  Layer.provide(RentalServiceLayer),
);

export const AiDepsLive = Layer.mergeAll(
  AiServiceLayer,
);
