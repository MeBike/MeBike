import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import type { JobProducer, QueueJob } from "@/infrastructure/jobs/ports";

import { StationQueryRepository } from "@/domain/stations/repository/station-query.repository";
import { UserQueryRepository } from "@/domain/users/repository/user-query.repository";
import logger from "@/lib/logger";

import type { EffectRunner } from "../worker-runtime";
import type {
  ReservationHoldWorkerEnv,
} from "./types";

import { enqueueExpiredEmailJob } from "./email-jobs";
import { expireReservationHoldInTransaction } from "./expire-hold.transaction";

/**
 * Tạo handler cho job hết hạn reservation hold.
 *
 * Handler này tách mutation và notification thành hai bước rõ ràng:
 * 1. transaction hết hạn reservation và nhả xe;
 * 2. nếu transaction thật sự expire thành công, đọc user/station và enqueue email.
 *
 * Các trường hợp reservation không còn phù hợp được xem là skip idempotent để
 * retry không làm thay đổi trạng thái đã được xử lý trước đó.
 *
 * @param runEffect Runner dùng runtime dài hạn của worker process.
 * @param producer Producer dùng để enqueue job email.
 * @returns Handler PgBoss cho queue `reservations.expireHold`.
 */
export function makeReservationExpireHoldHandler(
  runEffect: EffectRunner<ReservationHoldWorkerEnv>,
  producer: JobProducer,
) {
  return async function handleReservationExpireHold(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Reservation expire worker received empty batch");
      return;
    }

    let payload: { reservationId: string };
    try {
      payload = parseJobPayload(JobTypes.ReservationExpireHold, job.data);
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ jobId: job.id, error: message }, "Invalid reservation expire payload");
      throw err;
    }

    const result = await runEffect(
      Effect.gen(function* () {
        const userRepo = yield* UserQueryRepository;
        const stationRepo = yield* StationQueryRepository;
        const outcome = yield* expireReservationHoldInTransaction({
          reservationId: payload.reservationId,
          now: new Date(),
        });

        if (outcome.outcome !== "EXPIRED") {
          return outcome;
        }

        const userOpt = yield* userRepo.findById(outcome.userId);
        if (Option.isNone(userOpt)) {
          return { outcome: "SKIPPED", reason: "MISSING_USER" };
        }
        const user = userOpt.value;

        const stationOpt = yield* stationRepo.getById(outcome.stationId);
        if (Option.isNone(stationOpt)) {
          return { outcome: "SKIPPED", reason: "MISSING_STATION" };
        }
        const station = stationOpt.value;

        yield* enqueueExpiredEmailJob({
          producer,
          reservationId: outcome.reservationId,
          userEmail: user.email,
          fullName: user.fullname,
          stationName: station.name,
          bikeId: outcome.bikeId,
          endTime: outcome.endTime,
        });

        return { outcome: "EXPIRED_NOTIFIED" };
      }),
    );

    logger.info(
      { jobId: job.id, reservationId: payload.reservationId, result },
      "reservations.expireHold processed",
    );
  };
}
