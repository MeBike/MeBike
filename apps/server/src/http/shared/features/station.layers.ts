import { Layer } from "effect";

import { ReservationQueryRepositoryLive } from "@/domain/reservations";
import {
  StationRepositoryLive,
  StationServiceLive,
} from "@/domain/stations";

import { PrismaLive } from "../infra.layers";
import { AgencyReposLive } from "./agency.layers";

export const StationReposLive = StationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationReservationQueryReposLive = ReservationQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationServiceLayer = StationServiceLive.pipe(
  Layer.provide(Layer.mergeAll(StationReposLive, StationReservationQueryReposLive, AgencyReposLive)),
);

export const StationDepsLive = Layer.mergeAll(
  StationReposLive,
  StationReservationQueryReposLive,
  StationServiceLayer,
  PrismaLive,
);
