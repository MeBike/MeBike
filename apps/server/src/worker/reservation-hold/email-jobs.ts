import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";

import type { JobProducer } from "@/infrastructure/jobs/ports";

import { sendJob } from "@/infrastructure/jobs/send-job";
import {
  buildReservationExpiredEmail,
  buildReservationNearExpiryEmail,
} from "@/lib/email-templates";

/**
 * Enqueue email nhắc người dùng reservation sắp hết hạn.
 *
 * Hàm này chỉ chịu trách nhiệm dựng nội dung email và gửi job sang queue email.
 * Dedupe key được gắn theo reservation để retry cùng một job không gửi trùng.
 *
 * @param input Thông tin cần thiết để dựng email gần hết hạn.
 * @param input.producer Producer dùng để enqueue job email.
 * @param input.reservationId ID reservation dùng cho dedupe key.
 * @param input.userEmail Email người nhận.
 * @param input.fullName Tên hiển thị của người dùng.
 * @param input.stationName Tên trạm nhận xe.
 * @param input.bikeId ID xe đang được giữ.
 * @param input.minutesRemaining Số phút còn lại trước khi reservation hết hạn.
 */
export function enqueueNearExpiryEmailJob(input: {
  readonly producer: JobProducer;
  readonly reservationId: string;
  readonly userEmail: string;
  readonly fullName: string;
  readonly stationName: string;
  readonly bikeId: string;
  readonly minutesRemaining: number;
}): Effect.Effect<void> {
  const email = buildReservationNearExpiryEmail({
    fullName: input.fullName,
    stationName: input.stationName,
    bikeId: input.bikeId,
    minutesRemaining: input.minutesRemaining,
  });

  return Effect.tryPromise({
    try: () =>
      sendJob(
        input.producer,
        JobTypes.EmailSend,
        {
          version: 1,
          kind: "raw",
          to: input.userEmail,
          subject: email.subject,
          html: email.html,
        },
        {
          dedupeKey: `reservation:near-expiry:${input.reservationId}`,
        },
      ),
    catch: err => err as unknown,
  }).pipe(
    Effect.catchAll(err => Effect.die(err)),
    Effect.asVoid,
  );
}

/**
 * Enqueue email báo reservation đã hết hạn và xe đã được nhả.
 *
 * Thời gian hết hạn được format theo múi giờ vận hành Việt Nam để email hiển thị
 * nhất quán với người dùng nội địa.
 *
 * @param input Thông tin cần thiết để dựng email hết hạn.
 * @param input.producer Producer dùng để enqueue job email.
 * @param input.reservationId ID reservation dùng cho dedupe key.
 * @param input.userEmail Email người nhận.
 * @param input.fullName Tên hiển thị của người dùng.
 * @param input.stationName Tên trạm nhận xe.
 * @param input.bikeId ID xe vừa được nhả khỏi reservation.
 * @param input.endTime Thời điểm reservation hết hạn.
 */
export function enqueueExpiredEmailJob(input: {
  readonly producer: JobProducer;
  readonly reservationId: string;
  readonly userEmail: string;
  readonly fullName: string;
  readonly stationName: string;
  readonly bikeId: string;
  readonly endTime: Date;
}): Effect.Effect<void> {
  const endTimeLabel = input.endTime.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const email = buildReservationExpiredEmail({
    fullName: input.fullName,
    stationName: input.stationName,
    bikeId: input.bikeId,
    endTimeLabel,
  });

  return Effect.tryPromise({
    try: () =>
      sendJob(
        input.producer,
        JobTypes.EmailSend,
        {
          version: 1,
          kind: "raw",
          to: input.userEmail,
          subject: email.subject,
          html: email.html,
        },
        {
          dedupeKey: `reservation:expired:${input.reservationId}`,
        },
      ),
    catch: err => err as unknown,
  }).pipe(
    Effect.catchAll(err => Effect.die(err)),
    Effect.asVoid,
  );
}
