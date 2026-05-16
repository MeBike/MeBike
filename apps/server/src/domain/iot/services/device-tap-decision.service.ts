import type { DeviceTapEvent } from "@mebike/shared";

import { Effect, Layer, Match, Option } from "effect";

import type { RentalServiceFailure } from "@/domain/rentals";
import type { ReservationServiceFailure } from "@/domain/reservations";

import { BikeRepository } from "@/domain/bikes";
import { NfcCardQueryServiceTag } from "@/domain/nfc-cards";
import { ReservationQueryServiceTag } from "@/domain/reservations";

import { DeviceAccessCommandServiceTag } from "./device-access-command.service";

export type DeviceDenyReason
  = | "ACTIVE_RENTAL_EXISTS"
    | "ACTIVE_RESERVATION_EXISTS"
    | "BIKE_ALREADY_RENTED"
    | "BIKE_DISABLED"
    | "BIKE_BROKEN"
    | "BIKE_LOST"
    | "BIKE_NOT_AT_STATION"
    | "BIKE_NOT_FOUND"
    | "BIKE_PENDING_DISPATCH"
    | "BIKE_FIXED"
    | "BIKE_RESERVED"
    | "BIKE_UNAVAILABLE"
    | "BIKE_TRANSPORTING"
    | "BIKE_SWAPPING"
    | "CARD_BLOCKED"
    | "CARD_INACTIVE"
    | "CARD_LOST"
    | "CARD_NOT_FOUND"
    | "CARD_UNASSIGNED"
    | "INSUFFICIENT_FUNDS"
    | "OVERNIGHT_OPERATIONS_CLOSED"
    | "RENTAL_DENIED"
    | "RESERVATION_BIKE_MISMATCH"
    | "RESERVATION_DENIED"
    | "RESERVATION_INVALID"
    | "RESERVATION_MISSING_BIKE"
    | "RESERVATION_NOT_FOUND"
    | "RESERVATION_NOT_OWNED"
    | "RESERVATION_OPTION_UNSUPPORTED"
    | "STATION_RESERVATION_UNAVAILABLE"
    | "SUBSCRIPTION_NOT_FOUND"
    | "SUBSCRIPTION_NOT_USABLE"
    | "SUBSCRIPTION_REQUIRED"
    | "SUBSCRIPTION_USAGE_EXCEEDED"
    | "USER_BANNED"
    | "USER_NOT_VERIFIED"
    | "WALLET_NOT_FOUND";

export type TapDecision
  = | {
    readonly _tag: "Unlock";
    readonly userId: string;
    readonly reservationId?: string;
    readonly rentalId?: string;
  }
  | {
    readonly _tag: "Deny";
    readonly reason: DeviceDenyReason;
    readonly userId?: string;
    readonly reservationId?: string;
  };

/**
 * Service quyết định kết quả business của một tap event, chưa publish MQTT.
 */
export type DeviceTapDecisionService = {
  readonly decideTapEvent: (
    event: DeviceTapEvent,
    options?: { readonly now?: Date },
  ) => Effect.Effect<TapDecision>;
};

/**
 * Map lỗi domain reservation sang mã deny reason dùng cho luồng tap.
 */
function mapReservationFailureToDenyReason(failure: ReservationServiceFailure): DeviceDenyReason {
  switch (failure._tag) {
    case "OvernightOperationsClosed": return "OVERNIGHT_OPERATIONS_CLOSED";
    case "FixedSlotTemplateStartOutsideOperatingHours": return "OVERNIGHT_OPERATIONS_CLOSED";
    case "BikeAlreadyReserved": return "BIKE_RESERVED";
    case "BikeNotFound": return "BIKE_NOT_FOUND";
    case "BikeNotAvailable": return "BIKE_UNAVAILABLE";
    case "BikeNotFoundInStation": return "BIKE_NOT_AT_STATION";
    case "BikeIsPendingDispatch": return "BIKE_PENDING_DISPATCH";
    case "BikeIsTransporting": return "BIKE_TRANSPORTING";
    case "BikeIsSwapping": return "BIKE_SWAPPING";
    case "BikeIsBroken": return "BIKE_BROKEN";
    case "BikeIsFixed": return "BIKE_FIXED";
    case "BikeIsLost": return "BIKE_LOST";
    case "BikeIsDisabled": return "BIKE_DISABLED";
    case "ReservationNotFound": return "RESERVATION_NOT_FOUND";
    case "ReservationNotOwned": return "RESERVATION_NOT_OWNED";
    case "ReservationMissingBike": return "RESERVATION_MISSING_BIKE";
    case "InvalidReservationTransition": return "RESERVATION_INVALID";
    case "ReservationConfirmBlockedByActiveRental": return "ACTIVE_RENTAL_EXISTS";
    case "WalletNotFound": return "WALLET_NOT_FOUND";
    case "InsufficientWalletBalance": return "INSUFFICIENT_FUNDS";
    case "ActiveReservationExists": return "ACTIVE_RESERVATION_EXISTS";
    case "SubscriptionRequired": return "SUBSCRIPTION_REQUIRED";
    case "ReservationOptionNotSupported": return "RESERVATION_OPTION_UNSUPPORTED";
    case "StationReservationAvailabilityTooLow": return "STATION_RESERVATION_UNAVAILABLE";
    default: return "RESERVATION_DENIED";
  }
}

/**
 * Map lỗi domain rental sang mã deny reason dùng cho luồng tap.
 */
function mapRentalFailureToDenyReason(failure: RentalServiceFailure): DeviceDenyReason {
  switch (failure._tag) {
    case "OvernightOperationsClosed": return "OVERNIGHT_OPERATIONS_CLOSED";
    case "ActiveRentalExists": return "ACTIVE_RENTAL_EXISTS";
    case "BikeAlreadyRented": return "BIKE_ALREADY_RENTED";
    case "BikeNotFound": return "BIKE_NOT_FOUND";
    case "BikeMissingStation": return "BIKE_NOT_AT_STATION";
    case "BikeNotFoundInStation": return "BIKE_NOT_AT_STATION";
    case "BikeIsBroken": return "BIKE_BROKEN";
    case "BikeIsFixed": return "BIKE_FIXED";
    case "BikeIsReserved": return "BIKE_RESERVED";
    case "BikeIsPendingDispatch": return "BIKE_PENDING_DISPATCH";
    case "BikeIsTransporting": return "BIKE_TRANSPORTING";
    case "BikeIsSwapping": return "BIKE_SWAPPING";
    case "BikeIsLost": return "BIKE_LOST";
    case "BikeIsDisabled": return "BIKE_DISABLED";
    case "InvalidBikeStatus": return "BIKE_UNAVAILABLE";
    case "UserWalletNotFound": return "WALLET_NOT_FOUND";
    case "InsufficientBalanceToRent": return "INSUFFICIENT_FUNDS";
    case "SubscriptionNotFound": return "SUBSCRIPTION_NOT_FOUND";
    case "SubscriptionNotUsable": return "SUBSCRIPTION_NOT_USABLE";
    case "SubscriptionUsageExceeded": return "SUBSCRIPTION_USAGE_EXCEEDED";
    default: return "RENTAL_DENIED";
  }
}

function mapNfcCardStatusToDenyReason(status: import("generated/prisma/client").NfcCardStatus): DeviceDenyReason {
  switch (status) {
    case "UNASSIGNED":
      return "CARD_UNASSIGNED";
    case "BLOCKED":
      return "CARD_BLOCKED";
    case "LOST":
      return "CARD_LOST";
    case "ACTIVE":
      return "CARD_INACTIVE";
  }
}

/**
 * Tạo service quyết định business outcome cho luồng tap.
 */
const makeDeviceTapDecisionServiceEffect = Effect.gen(function* () {
  const bikeRepository = yield* BikeRepository;
  const deviceAccessCommandService = yield* DeviceAccessCommandServiceTag;
  const nfcCardQueryService = yield* NfcCardQueryServiceTag;
  const reservationQueryService = yield* ReservationQueryServiceTag;

  const deny = (
    reason: DeviceDenyReason,
    meta: Omit<Extract<TapDecision, { _tag: "Deny" }>, "_tag" | "reason"> = {},
  ): Effect.Effect<TapDecision> => Effect.succeed({
    _tag: "Deny",
    reason,
    ...meta,
  });

  const unlock = (
    meta: Omit<Extract<TapDecision, { _tag: "Unlock" }>, "_tag">,
  ): Effect.Effect<TapDecision> => Effect.succeed({
    _tag: "Unlock",
    ...meta,
  });

  const confirmReservationForTap = (
    userId: string,
    reservationId: string,
    now: Date,
  ) =>
    deviceAccessCommandService.confirmReservation({ reservationId, userId, now }).pipe(
      Effect.matchEffect({
        onFailure: failure => deny(mapReservationFailureToDenyReason(failure), { userId }),
        onSuccess: reservation =>
          unlock({
            userId,
            reservationId: reservation.id,
          }),
      }),
    );

  const startRentalForTap = (
    userId: string,
    bikeId: string,
    stationId: string,
    now: Date,
  ) =>
    deviceAccessCommandService.startRental({
      userId,
      bikeId,
      startStationId: stationId,
      startTime: now,
      now,
      subscriptionId: undefined,
    }).pipe(
      Effect.matchEffect({
        onFailure: failure => deny(mapRentalFailureToDenyReason(failure), { userId }),
        onSuccess: rental =>
          unlock({
            userId,
            rentalId: rental.id,
          }),
      }),
    );

  const service: DeviceTapDecisionService = {
    decideTapEvent: (event, options) =>
      Effect.gen(function* () {
        const now = options?.now ?? new Date();

        const cardOpt = yield* nfcCardQueryService.findByUid(event.cardUid);
        if (Option.isNone(cardOpt)) {
          return yield* deny("CARD_NOT_FOUND");
        }
        const card = cardOpt.value;

        if (card.status !== "ACTIVE") {
          return yield* deny(mapNfcCardStatusToDenyReason(card.status), {
            userId: card.assignedUser?.id,
          });
        }

        if (!card.assignedUser) {
          return yield* deny("CARD_UNASSIGNED");
        }

        const user = card.assignedUser;

        if (user.verify !== "VERIFIED") {
          return yield* deny("USER_NOT_VERIFIED", { userId: user.id });
        }

        if (user.accountStatus === "BANNED") {
          return yield* deny("USER_BANNED", { userId: user.id });
        }

        // Current contract: MQTT deviceId equals Bike.id.
        const bikeOpt = yield* bikeRepository.getById(event.deviceId);
        if (Option.isNone(bikeOpt)) {
          return yield* deny("BIKE_NOT_FOUND", { userId: user.id });
        }
        const bike = bikeOpt.value;

        if (!bike.stationId) {
          return yield* deny("BIKE_NOT_AT_STATION", { userId: user.id });
        }

        const holdOpt = yield* reservationQueryService.getCurrentHoldForUserNow(user.id, now);
        if (Option.isSome(holdOpt)) {
          if (holdOpt.value.bikeId !== bike.id) {
            return yield* deny("RESERVATION_BIKE_MISMATCH", {
              userId: user.id,
              reservationId: holdOpt.value.id,
            });
          }

          return yield* confirmReservationForTap(user.id, holdOpt.value.id, now);
        }

        return yield* startRentalForTap(user.id, bike.id, bike.stationId, now);
      }),
  };

  return service;
});

/**
 * Tag Effect cho service quyết định tap.
 */
export class DeviceTapDecisionServiceTag extends Effect.Service<DeviceTapDecisionServiceTag>()(
  "DeviceTapDecisionService",
  {
    effect: makeDeviceTapDecisionServiceEffect,
  },
) {}

/**
 * Live layer cho service quyết định tap.
 */
export const DeviceTapDecisionServiceLive = Layer.effect(
  DeviceTapDecisionServiceTag,
  makeDeviceTapDecisionServiceEffect.pipe(Effect.map(DeviceTapDecisionServiceTag.make)),
);
