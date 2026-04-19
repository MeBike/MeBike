import { Layer } from "effect";

import { AiChatServiceLive } from "@/domain/ai";

import { BikeServiceLayer } from "./bike.layers";
import { RentalCommandServiceLayer, RentalServiceLayer } from "./rental.layers";
import { ReservationQueryServiceLayer } from "./reservation.layers";
import { StationQueryServiceLayer } from "./station.layers";
import { WalletServiceLayer } from "./wallet.layers";

export const AiServiceLayer = AiChatServiceLive.pipe(
  Layer.provide(WalletServiceLayer),
  Layer.provide(StationQueryServiceLayer),
  Layer.provide(ReservationQueryServiceLayer),
  Layer.provide(RentalServiceLayer),
  Layer.provide(RentalCommandServiceLayer),
  Layer.provide(BikeServiceLayer),
);

export const AiDepsLive = Layer.mergeAll(
  AiServiceLayer,
);
