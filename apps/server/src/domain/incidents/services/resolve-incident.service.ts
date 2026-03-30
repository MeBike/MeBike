import { Effect, Option } from "effect";

import { makeBikeRepository } from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import {
  IncidentNotFound,
  IncidentRepositoryError,
  UnauthorizedIncidentAccess,
} from "../domain-errors";
import { makeIncidentRepository } from "../repository/incident.repository";

export function resolveIncidentUseCase(userId: string, incidentId: string) {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const incidentRepo = makeIncidentRepository(tx);
        const bikeRepo = makeBikeRepository(tx);

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
        yield* bikeRepo.updateStatus(incidentDetail.bike.id, "BOOKED");

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
