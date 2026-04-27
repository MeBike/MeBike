import type { BikeRepository } from "@/domain/bikes";
import type { ReservationQueryRepository } from "@/domain/reservations";
import type { StationQueryRepository } from "@/domain/stations/repository/station-query.repository";
import type { UserQueryRepository } from "@/domain/users/repository/user-query.repository";
import type { Prisma } from "@/infrastructure/prisma";

export type ReservationHoldWorkerEnv
  = | ReservationQueryRepository
    | BikeRepository
    | UserQueryRepository
    | StationQueryRepository
    | Prisma;

export type ReservationNearExpiryOutcome
  = | { readonly outcome: "NOT_FOUND" }
    | {
      readonly outcome: "SKIPPED";
      readonly reason: "NOT_PENDING" | "NOT_DUE" | "MISSING_BIKE" | "MISSING_USER" | "MISSING_STATION";
    }
    | { readonly outcome: "NOTIFIED" };

export type ReservationExpireHoldTransactionOutcome
  = | { readonly outcome: "NOT_FOUND" }
    | {
      readonly outcome: "SKIPPED";
      readonly reason: "NOT_PENDING" | "NOT_DUE" | "MISSING_BIKE" | "ALREADY_HANDLED";
    }
    | {
      readonly outcome: "EXPIRED";
      readonly reservationId: string;
      readonly userId: string;
      readonly stationId: string;
      readonly bikeId: string;
      readonly endTime: Date;
    };

export type ReservationExpireHoldOutcome
  = | ReservationExpireHoldTransactionOutcome
    | { readonly outcome: "SKIPPED"; readonly reason: "MISSING_USER" | "MISSING_STATION" }
    | { readonly outcome: "EXPIRED_NOTIFIED" };
