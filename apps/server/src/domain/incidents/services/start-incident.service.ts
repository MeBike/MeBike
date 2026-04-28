import { Effect, Option } from "effect";

import type { MapboxRouting } from "@/infrastructure/mapbox";

import { makeBikeRepository } from "@/domain/bikes";
import {
  AdminRentalNotFound,
  makeRentalRepository,
  NoAvailableBike,
} from "@/domain/rentals";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import {
  IncidentNotFound,
  IncidentRepositoryError,
  UnauthorizedIncidentAccess,
} from "../domain-errors";
import { makeIncidentRepository } from "../repository/incident.repository";

export function startIncidentUseCase(
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

        const foundIncident = yield* incidentRepo.getById(incidentId);
        if (Option.isNone(foundIncident)) {
          return yield* Effect.fail(new IncidentNotFound({ id: incidentId }));
        }

        const incident = foundIncident.value;
        if (
          incident.assignments?.technician?.id !== userId
          || incident.assignments?.status !== "ACCEPTED"
        ) {
          return yield* Effect.fail(
            new UnauthorizedIncidentAccess({ incidentId, userId }),
          );
        }

        yield* incidentRepo.updateAssignmentStatus(incidentId, "IN_PROGRESS");
        yield* incidentRepo.updateStatus(incidentId, "IN_PROGRESS");

        if (incident.source === "DURING_RENTAL" && incident.rental?.id) {
          const rental = yield* rentalRepo.findById(incident.rental.id);
          if (Option.isNone(rental)) {
            return yield* Effect.fail(
              new AdminRentalNotFound(incident.rental.id),
            );
          }

          const station = yield* Effect.tryPromise({
            try: () =>
              tx.userOrgAssignment.findFirst({
                where: {
                  userId,
                },
                select: {
                  technicianTeam: {
                    select: {
                      stationId: true,
                    },
                  },
                },
              }),
            catch: e =>
              new IncidentRepositoryError({
                operation: "startIncident.getTechnicianAssignment",
                cause: e,
              }),
          });

          const stationId = station?.technicianTeam?.stationId;
          if (!stationId) {
            return yield* Effect.fail(
              new IncidentRepositoryError({
                operation: "startIncident.getTechnicianAssignment",
                cause: "Technician has no station assigned",
              }),
            );
          }

          const availableBike
            = yield* bikeRepo.findAvailableByStation(stationId);

          if (Option.isNone(availableBike)) {
            return yield* Effect.fail(new NoAvailableBike({}));
          }
          else {
            yield* Effect.tryPromise({
              try: () =>
                tx.rental.update({
                  where: { id: incident.rental!.id },
                  data: { bikeId: availableBike.value.id },
                }),
              catch: e =>
                new IncidentRepositoryError({
                  operation: "startIncident.swapBike",
                  cause: e,
                }),
            });

            yield* bikeRepo.updateStatus(incident.bike.id, "BROKEN");
            yield* bikeRepo.updateStatus(availableBike.value.id, "DISABLED");
          }
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
            operation: "startIncident.transaction",
            cause: e.cause,
          }),
        )),
    );
  });
}
