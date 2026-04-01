import { Effect, Option } from "effect";

import type { MapboxRouting } from "@/infrastructure/mapbox";

import { makeBikeRepository } from "@/domain/bikes";
import { AdminRentalNotFound, makeRentalRepository } from "@/domain/rentals";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import {
  IncidentNotFound,
  IncidentRepositoryError,
  UnauthorizedIncidentAccess,
} from "../domain-errors";
import { makeIncidentRepository } from "../repository/incident.repository";

export function resolveIncidentUseCase(
  userId: string,
  incidentId: string,
  mapbox: MapboxRouting,
) {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const incidentRepo = makeIncidentRepository(tx, mapbox);
        const bikeRepo = makeBikeRepository(tx);
        const rentalRepo = makeRentalRepository(tx);

        const incident = yield* incidentRepo.getById(incidentId);
        if (Option.isNone(incident)) {
          return yield* Effect.fail(new IncidentNotFound({ id: incidentId }));
        }

        const incidentDetail = incident.value;

        if (
          incidentDetail.assignments?.technician?.id !== userId
          || incidentDetail.assignments?.status !== "IN_PROGRESS"
        ) {
          return yield* Effect.fail(
            new UnauthorizedIncidentAccess({ incidentId, userId }),
          );
        }

        yield* incidentRepo.updateAssignmentStatus(incidentId, "RESOLVED");
        yield* incidentRepo.updateStatus(incidentId, "RESOLVED");

        if (incidentDetail.rental?.id) {
          const rental = yield* rentalRepo.findById(incidentDetail.rental.id);
          if (Option.isNone(rental)) {
            return yield* Effect.fail(
              new AdminRentalNotFound(incidentDetail.rental.id),
            );
          }
          yield* bikeRepo.updateStatus(rental.value.bikeId, "BOOKED");
        }

        const finalIncident = yield* incidentRepo.getById(incidentId);
        return yield* Option.match(finalIncident, {
          onNone: () => Effect.fail(new IncidentNotFound({ id: incidentId })),
          onSome: i => Effect.succeed(i),
        });
      })).pipe(
      Effect.catchTag("PrismaTransactionError", e =>
        Effect.fail(
          new IncidentRepositoryError({
            operation: "resolveIncident.transaction",
            cause: e.cause,
          }),
        )),
    );
  });
}
