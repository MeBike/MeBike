import { Effect, Layer } from "effect";

import type {
  RentalRow,
  RentalServiceFailure,
} from "@/domain/rentals";
import type { StartRentalInput } from "@/domain/rentals/types";
import type {
  ConfirmReservationInput,
  ReservationRow,
  ReservationServiceFailure,
} from "@/domain/reservations";

import { BikeRepository } from "@/domain/bikes";
import { RentalRepository, startRental } from "@/domain/rentals";
import {
  confirmReservation,
} from "@/domain/reservations";
import { SubscriptionCommandServiceTag } from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";

/**
 * Adapter command cho luồng IoT.
 *
 * Mục tiêu: gom toàn bộ wiring `provideService(...)` của các use case
 * reservation/rental vào một chỗ, để `device-tap.service.ts` chỉ còn logic điều phối.
 */
export type DeviceAccessCommandService = {
  readonly confirmReservation: (
    input: ConfirmReservationInput,
  ) => Effect.Effect<ReservationRow, ReservationServiceFailure>;
  readonly startRental: (
    input: StartRentalInput,
  ) => Effect.Effect<RentalRow, RentalServiceFailure>;
};

/**
 * Các dependency cần để gọi các use case command hiện có của reservation/rental.
 */
type DeviceAccessCommandDeps = {
  readonly prisma: typeof Prisma.Service;
  readonly bikeRepository: typeof BikeRepository.Service;
  readonly rentalRepository: typeof RentalRepository.Service;
  readonly subscriptionCommandService: typeof SubscriptionCommandServiceTag.Service;
};

/**
 * Provide dependency cho use case xác nhận reservation từ luồng tap.
 */
function provideConfirmReservationDeps(
  effect: Effect.Effect<
    ReservationRow,
    ReservationServiceFailure,
    Prisma
  >,
  deps: DeviceAccessCommandDeps,
): Effect.Effect<ReservationRow, ReservationServiceFailure> {
  return effect.pipe(
    Effect.provideService(Prisma, deps.prisma),
  );
}

/**
 * Provide dependency cho use case bắt đầu rental từ luồng tap.
 */
function provideStartRentalDeps(
  effect: Effect.Effect<
    RentalRow,
    RentalServiceFailure,
    Prisma | RentalRepository | BikeRepository | SubscriptionCommandServiceTag
  >,
  deps: DeviceAccessCommandDeps,
): Effect.Effect<RentalRow, RentalServiceFailure> {
  return effect.pipe(
    Effect.provideService(SubscriptionCommandServiceTag, deps.subscriptionCommandService),
    Effect.provideService(BikeRepository, deps.bikeRepository),
    Effect.provideService(RentalRepository, deps.rentalRepository),
    Effect.provideService(Prisma, deps.prisma),
  );
}

/**
 * Tạo adapter command cho luồng truy cập bike từ thiết bị.
 */
export function makeDeviceAccessCommandService(
  deps: DeviceAccessCommandDeps,
): DeviceAccessCommandService {
  return {
    confirmReservation: input =>
      provideConfirmReservationDeps(confirmReservation(input), deps),
    startRental: input =>
      provideStartRentalDeps(startRental(input), deps),
  };
}

/**
 * Khởi tạo live implementation cho adapter command IoT.
 */
const makeDeviceAccessCommandServiceEffect = Effect.gen(function* () {
  const prisma = yield* Prisma;
  const bikeRepository = yield* BikeRepository;
  const rentalRepository = yield* RentalRepository;
  const subscriptionCommandService = yield* SubscriptionCommandServiceTag;

  return makeDeviceAccessCommandService({
    prisma,
    bikeRepository,
    rentalRepository,
    subscriptionCommandService,
  });
});

/**
 * Tag Effect cho adapter command IoT.
 */
export class DeviceAccessCommandServiceTag extends Effect.Service<DeviceAccessCommandServiceTag>()(
  "DeviceAccessCommandService",
  {
    effect: makeDeviceAccessCommandServiceEffect,
  },
) {}

/**
 * Live layer cho adapter command IoT.
 */
export const DeviceAccessCommandServiceLive = Layer.effect(
  DeviceAccessCommandServiceTag,
  makeDeviceAccessCommandServiceEffect.pipe(Effect.map(DeviceAccessCommandServiceTag.make)),
);
