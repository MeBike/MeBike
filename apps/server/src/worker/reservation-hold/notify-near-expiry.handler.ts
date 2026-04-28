import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import type { JobProducer, QueueJob } from "@/infrastructure/jobs/ports";

import { ReservationQueryRepository } from "@/domain/reservations";
import { StationQueryRepository } from "@/domain/stations/repository/station-query.repository";
import { UserQueryRepository } from "@/domain/users/repository/user-query.repository";
import logger from "@/lib/logger";

import type { EffectRunner } from "../worker-runtime";
import type {
  ReservationHoldWorkerEnv,
} from "./types";

import { enqueueNearExpiryEmailJob } from "./email-jobs";

/**
 * Tạo handler cho job nhắc reservation sắp hết hạn.
 *
 * Handler này chỉ gửi email khi reservation vẫn `PENDING`, chưa quá hạn, có xe,
 * và còn đủ thông tin user/station để dựng email. Các trạng thái không còn phù
 * hợp được xem là skip idempotent để retry không tạo tác dụng phụ mới.
 *
 * @param runEffect Runner dùng runtime dài hạn của worker process.
 * @param producer Producer dùng để enqueue job email.
 * @returns Handler PgBoss cho queue `reservations.notifyNearExpiry`.
 */
export function makeReservationNotifyNearExpiryHandler(
  runEffect: EffectRunner<ReservationHoldWorkerEnv>,
  producer: JobProducer,
) {
  return async function handleReservationNotifyNearExpiry(job: QueueJob | undefined): Promise<void> {
    if (!job) {
      logger.warn("Reservation notify worker received empty batch");
      return;
    }

    let payload: { reservationId: string };
    try {
      payload = parseJobPayload(JobTypes.ReservationNotifyNearExpiry, job.data);
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ jobId: job.id, error: message }, "Invalid reservation notify payload");
      throw err;
    }

    const result = await runEffect(
      Effect.gen(function* () {
        const reservationRepo = yield* ReservationQueryRepository;
        const userRepo = yield* UserQueryRepository;
        const stationRepo = yield* StationQueryRepository;
        const now = new Date();

        const reservationOpt = yield* reservationRepo.findById(payload.reservationId);
        if (Option.isNone(reservationOpt)) {
          return { outcome: "NOT_FOUND" };
        }
        const reservation = reservationOpt.value;

        if (reservation.status !== "PENDING") {
          return { outcome: "SKIPPED", reason: "NOT_PENDING" };
        }
        if (!reservation.endTime || reservation.endTime <= now) {
          return { outcome: "SKIPPED", reason: "NOT_DUE" };
        }
        if (!reservation.bikeId) {
          return { outcome: "SKIPPED", reason: "MISSING_BIKE" };
        }

        const userOpt = yield* userRepo.findById(reservation.userId);
        if (Option.isNone(userOpt)) {
          return { outcome: "SKIPPED", reason: "MISSING_USER" };
        }
        const user = userOpt.value;

        const stationOpt = yield* stationRepo.getById(reservation.stationId);
        if (Option.isNone(stationOpt)) {
          return { outcome: "SKIPPED", reason: "MISSING_STATION" };
        }
        const station = stationOpt.value;

        const minutesRemaining = Math.ceil(
          (reservation.endTime.getTime() - now.getTime()) / (60 * 1000),
        );

        yield* enqueueNearExpiryEmailJob({
          producer,
          reservationId: reservation.id,
          userEmail: user.email,
          fullName: user.fullname,
          stationName: station.name,
          bikeId: reservation.bikeId,
          minutesRemaining,
        });

        return { outcome: "NOTIFIED" };
      }),
    );

    logger.info(
      { jobId: job.id, reservationId: payload.reservationId, result },
      "reservations.notifyNearExpiry processed",
    );
  };
}
