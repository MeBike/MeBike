import type { DeviceTapEvent } from "@mebike/shared";

import { Effect, Layer, Match, Option } from "effect";

import type { RentalServiceFailure } from "@/domain/rentals";
import type { ReservationServiceFailure } from "@/domain/reservations";
import type { MqttPublishError } from "@/infrastructure/mqtt";

import { BikeRepository } from "@/domain/bikes";
import { NfcCardQueryServiceTag } from "@/domain/nfc-cards";
import { ReservationQueryServiceTag } from "@/domain/reservations";

import { DeviceAccessCommandServiceTag } from "./device-access-command.service";
import { DeviceCommandServiceTag } from "./device-command.live";

/**
 * Kết quả cuối cùng của một tap event sau khi server ra quyết định.
 */
export type DeviceTapHandlingResult = {
  readonly requestId: string;
  readonly bikeId: string;
  readonly decision: "unlock" | "deny";
  readonly reason?: string;
  readonly userId?: string;
  readonly reservationId?: string;
  readonly rentalId?: string;
};

/**
 * Service điều phối toàn bộ luồng quẹt thẻ trên bike.
 */
export type DeviceTapService = {
  readonly handleTapEvent: (
    event: DeviceTapEvent,
    options?: { readonly now?: Date },
  ) => Effect.Effect<DeviceTapHandlingResult, MqttPublishError>;
};

/**
 * Map lỗi domain reservation sang mã deny reason gửi xuống firmware.
 */
function mapReservationFailureToDenyReason(failure: ReservationServiceFailure): string {
  return Match.value(failure).pipe(
    Match.tag("OvernightOperationsClosed", () => "OVERNIGHT_OPERATIONS_CLOSED"),
    Match.tag("BikeAlreadyReserved", () => "BIKE_RESERVED"),
    Match.tag("BikeNotFound", () => "BIKE_NOT_FOUND"),
    Match.tag("BikeNotAvailable", () => "BIKE_UNAVAILABLE"),
    Match.tag("BikeNotFoundInStation", () => "BIKE_NOT_AT_STATION"),
    Match.tag("BikeIsRedistributing", () => "BIKE_REDISTRIBUTING"),
    Match.tag("BikeIsLost", () => "BIKE_LOST"),
    Match.tag("BikeIsDisabled", () => "BIKE_DISABLED"),
    Match.tag("ReservationNotFound", () => "RESERVATION_NOT_FOUND"),
    Match.tag("ReservationNotOwned", () => "RESERVATION_NOT_OWNED"),
    Match.tag("ReservationMissingBike", () => "RESERVATION_MISSING_BIKE"),
    Match.tag("InvalidReservationTransition", () => "RESERVATION_INVALID"),
    Match.tag("ReservationConfirmBlockedByActiveRental", () => "ACTIVE_RENTAL_EXISTS"),
    Match.tag("WalletNotFound", () => "WALLET_NOT_FOUND"),
    Match.tag("InsufficientWalletBalance", () => "INSUFFICIENT_FUNDS"),
    Match.tag("ActiveReservationExists", () => "ACTIVE_RESERVATION_EXISTS"),
    Match.tag("SubscriptionRequired", () => "SUBSCRIPTION_REQUIRED"),
    Match.tag("ReservationOptionNotSupported", () => "RESERVATION_OPTION_UNSUPPORTED"),
    Match.tag("StationReservationAvailabilityTooLow", () => "STATION_RESERVATION_UNAVAILABLE"),
    Match.orElse(() => "RESERVATION_DENIED"),
  );
}

/**
 * Map lỗi domain rental sang mã deny reason gửi xuống firmware.
 */
function mapRentalFailureToDenyReason(failure: RentalServiceFailure): string {
  return Match.value(failure).pipe(
    Match.tag("OvernightOperationsClosed", () => "OVERNIGHT_OPERATIONS_CLOSED"),
    Match.tag("ActiveRentalExists", () => "ACTIVE_RENTAL_EXISTS"),
    Match.tag("BikeAlreadyRented", () => "BIKE_ALREADY_RENTED"),
    Match.tag("BikeNotFound", () => "BIKE_NOT_FOUND"),
    Match.tag("BikeMissingStation", () => "BIKE_NOT_AT_STATION"),
    Match.tag("BikeNotFoundInStation", () => "BIKE_NOT_AT_STATION"),
    Match.tag("BikeIsBroken", () => "BIKE_BROKEN"),
    Match.tag("BikeIsReserved", () => "BIKE_RESERVED"),
    Match.tag("BikeIsRedistributing", () => "BIKE_REDISTRIBUTING"),
    Match.tag("BikeIsLost", () => "BIKE_LOST"),
    Match.tag("BikeIsDisabled", () => "BIKE_DISABLED"),
    Match.tag("InvalidBikeStatus", () => "BIKE_UNAVAILABLE"),
    Match.tag("UserWalletNotFound", () => "WALLET_NOT_FOUND"),
    Match.tag("InsufficientBalanceToRent", () => "INSUFFICIENT_FUNDS"),
    Match.tag("SubscriptionNotFound", () => "SUBSCRIPTION_NOT_FOUND"),
    Match.tag("SubscriptionNotUsable", () => "SUBSCRIPTION_NOT_USABLE"),
    Match.tag("SubscriptionUsageExceeded", () => "SUBSCRIPTION_USAGE_EXCEEDED"),
    Match.orElse(() => "RENTAL_DENIED"),
  );
}

function mapNfcCardStatusToDenyReason(status: import("generated/prisma/client").NfcCardStatus): string {
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
 * Khởi tạo live implementation cho tap service.
 */
const makeDeviceTapServiceEffect = Effect.gen(function* () {
  const bikeRepository = yield* BikeRepository;
  const deviceAccessCommandService = yield* DeviceAccessCommandServiceTag;
  const deviceCommandService = yield* DeviceCommandServiceTag;
  const nfcCardQueryService = yield* NfcCardQueryServiceTag;
  const reservationQueryService = yield* ReservationQueryServiceTag;

  const denyTap = (
    event: DeviceTapEvent,
    reason: string,
    meta: Omit<DeviceTapHandlingResult, "bikeId" | "decision" | "requestId"> = {},
  ) =>
    deviceCommandService.sendDeny({
      deviceId: event.deviceId,
      requestId: event.requestId,
      reason,
    }).pipe(
      Effect.as({
        requestId: event.requestId,
        bikeId: event.deviceId,
        decision: "deny" as const,
        reason,
        ...meta,
      }),
    );

  const unlockTap = (
    event: DeviceTapEvent,
    meta: Omit<DeviceTapHandlingResult, "bikeId" | "decision" | "requestId">,
  ) =>
    deviceCommandService.sendUnlock({
      deviceId: event.deviceId,
      requestId: event.requestId,
    }).pipe(
      Effect.as({
        requestId: event.requestId,
        bikeId: event.deviceId,
        decision: "unlock" as const,
        ...meta,
      }),
    );

  /**
   * Thử xác nhận reservation đang giữ cho bike hiện tại.
   */
  const confirmReservationForTap = (
    event: DeviceTapEvent,
    userId: string,
    reservationId: string,
    now: Date,
  ) =>
    deviceAccessCommandService.confirmReservation({ reservationId, userId, now }).pipe(
      Effect.matchEffect({
        onFailure: failure => denyTap(event, mapReservationFailureToDenyReason(failure), { userId }),
        onSuccess: reservation =>
          unlockTap(event, {
            userId,
            reservationId: reservation.id,
          }),
      }),
    );

  /**
   * Thử bắt đầu rental trực tiếp khi user không có reservation phù hợp.
   */
  const startRentalForTap = (
    event: DeviceTapEvent,
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
        onFailure: failure => denyTap(event, mapRentalFailureToDenyReason(failure), { userId }),
        onSuccess: rental =>
          unlockTap(event, {
            userId,
            rentalId: rental.id,
          }),
      }),
    );

  /**
   * Logic chính của luồng tap:
   * - tìm user bằng `nfcCardUid`
   * - resolve bike bằng `Bike.id`
   * - nếu có current hold đúng bike thì confirm reservation
   * - nếu không thì start rental trực tiếp
   * - cuối cùng publish `unlock` hoặc `deny`
   */
  const service: DeviceTapService = {
    handleTapEvent: (event, options) =>
      Effect.gen(function* () {
        const now = options?.now ?? new Date();

        const cardOpt = yield* nfcCardQueryService.findByUid(event.cardUid);
        if (Option.isNone(cardOpt)) {
          return yield* denyTap(event, "CARD_NOT_FOUND");
        }
        const card = cardOpt.value;

        if (card.status !== "ACTIVE") {
          return yield* denyTap(event, mapNfcCardStatusToDenyReason(card.status), {
            userId: card.assignedUser?.id,
          });
        }

        if (!card.assignedUser) {
          return yield* denyTap(event, "CARD_UNASSIGNED");
        }

        const user = card.assignedUser;

        if (user.verify !== "VERIFIED") {
          return yield* denyTap(event, "USER_NOT_VERIFIED", { userId: user.id });
        }

        if (user.accountStatus === "BANNED") {
          return yield* denyTap(event, "USER_BANNED", { userId: user.id });
        }

        // Current contract: MQTT deviceId equals Bike.id.
        const bikeOpt = yield* bikeRepository.getById(event.deviceId);
        if (Option.isNone(bikeOpt)) {
          return yield* denyTap(event, "BIKE_NOT_FOUND", { userId: user.id });
        }
        const bike = bikeOpt.value;

        if (!bike.stationId) {
          return yield* denyTap(event, "BIKE_NOT_AT_STATION", { userId: user.id });
        }

        const holdOpt = yield* reservationQueryService.getCurrentHoldForUserNow(user.id, now);
        if (Option.isSome(holdOpt)) {
          if (holdOpt.value.bikeId !== bike.id) {
            return yield* denyTap(event, "RESERVATION_BIKE_MISMATCH", {
              userId: user.id,
              reservationId: holdOpt.value.id,
            });
          }

          return yield* confirmReservationForTap(event, user.id, holdOpt.value.id, now);
        }

        return yield* startRentalForTap(event, user.id, bike.id, bike.stationId, now);
      }),
  };

  return service;
});

/**
 * Tag Effect cho tap orchestration service.
 */
export class DeviceTapServiceTag extends Effect.Service<DeviceTapServiceTag>()(
  "DeviceTapService",
  {
    effect: makeDeviceTapServiceEffect,
  },
) {}

/**
 * Live layer cho tap orchestration service.
 */
export const DeviceTapServiceLive = Layer.effect(
  DeviceTapServiceTag,
  makeDeviceTapServiceEffect.pipe(Effect.map(DeviceTapServiceTag.make)),
);
