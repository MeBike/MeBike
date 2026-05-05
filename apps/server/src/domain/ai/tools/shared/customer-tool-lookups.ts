import { Effect, Either, Option } from "effect";

import type { RentalService } from "@/domain/rentals";
import type { StationQueryService } from "@/domain/stations";

import { rentalToolPage } from "./customer-tool-inputs";

export async function getStationByIdOrNull(
  stationQueryService: StationQueryService,
  stationId: string,
) {
  const station = await Effect.runPromise(
    stationQueryService.getStationById(stationId).pipe(Effect.either),
  );

  return Either.isRight(station) ? station.right : null;
}

export async function resolveRentalReference(args: {
  rentalId?: string | null;
  reference: "current" | "latest" | "id";
  rentalService: RentalService;
  userId: string;
}) {
  let rentalId = args.rentalId ?? null;

  if (!rentalId && args.reference === "current") {
    const rentals = await Effect.runPromise(
      args.rentalService.listMyCurrentRentals(args.userId, {
        ...rentalToolPage,
        pageSize: 1,
      }),
    );
    rentalId = rentals.items[0]?.id ?? null;
  }

  if (!rentalId && args.reference === "latest") {
    const rentals = await Effect.runPromise(
      args.rentalService.listMyRentals(args.userId, {}, {
        ...rentalToolPage,
        pageSize: 1,
      }),
    );
    rentalId = rentals.items[0]?.id ?? null;
  }

  if (!rentalId) {
    return null;
  }

  const rental = await Effect.runPromise(
    args.rentalService.getMyRentalById(args.userId, rentalId),
  );

  return Option.isSome(rental) ? rental.value : null;
}
