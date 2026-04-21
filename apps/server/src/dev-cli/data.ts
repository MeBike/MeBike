import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { safeParseJobPayload } from "@mebike/shared/contracts/server/jobs";

import type { PrismaClient } from "generated/prisma/client";

import { confirmRentalReturnByStaff, withPrismaClient } from "./runtime";

export const EMAIL_JOB_TYPE = "emails.send";

export type EmailJobStatus = "ALL" | "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export type StationSummaryRow = {
  id: string;
  name: string;
  address: string;
  stationType: "INTERNAL" | "AGENCY";
  totalCapacity: number;
  returnSlotLimit: number;
  updatedAt: Date;
  totalBikes: number;
  availableBikes: number;
  bookedBikes: number;
  brokenBikes: number;
  reservedBikes: number;
  maintainedBikes: number;
  unavailableBikes: number;
};

export type StationBikeRow = {
  id: string;
  bikeNumber: string;
  chipId: string;
  status: string;
  updatedAt: Date;
  activeRentalId: string | null;
  pendingReservationId: string | null;
};

export type StationInspection = StationSummaryRow & {
  bikes: StationBikeRow[];
};

export type BikeRentalSnapshot = {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date | null;
  userId: string;
  userEmail: string;
};

export type BikeInspection = {
  id: string;
  bikeNumber: string;
  chipId: string;
  status: string;
  stationId: string | null;
  stationName: string | null;
  stationAddress: string | null;
  supplierId: string | null;
  supplierName: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeRentalId: string | null;
  pendingReservationId: string | null;
  recentRentals: BikeRentalSnapshot[];
};

export type ActiveRentalInspectorRow = {
  id: string;
  userId: string;
  userEmail: string;
  bikeId: string;
  bikeNumber: string;
  bikeChipId: string;
  startStationId: string;
  startStationName: string;
  startTime: Date;
  status: string;
};

export type PersonaRentalHistoryRow = {
  id: string;
  status: string;
  bikeId: string;
  bikeNumber: string;
  bikeChipId: string;
  startStationId: string;
  startStationName: string;
  endStationId: string | null;
  endStationName: string | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  updatedAt: Date;
};

export type PersonaRentalDetail = {
  id: string;
  userId: string;
  userEmail: string;
  status: string;
  bikeId: string;
  bikeNumber: string;
  bikeChipId: string;
  bikeStatus: string;
  startStationId: string;
  startStationName: string;
  startStationAddress: string;
  endStationId: string | null;
  endStationName: string | null;
  endStationAddress: string | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  subscriptionId: string | null;
  updatedAt: Date;
  returnConfirmedAt: Date | null;
  returnConfirmationMethod: string | null;
  returnHandoverStatus: string | null;
  returnConfirmedByUserId: string | null;
  returnConfirmedByUserEmail: string | null;
  returnConfirmationStationId: string | null;
  returnConfirmationStationName: string | null;
  billedTotalAmount: number | null;
  billedBaseAmount: number | null;
  billedOvertimeAmount: number | null;
  billedCouponDiscountAmount: number | null;
  billedSubscriptionDiscountAmount: number | null;
  billedDepositForfeited: boolean | null;
  penaltiesTotalAmount: number | null;
  penaltiesCount: number;
};

export type EmailJobRow = {
  id: string;
  status: Exclude<EmailJobStatus, "ALL">;
  attempts: number;
  dedupeKey: string | null;
  lastError: string | null;
  createdAt: Date;
  runAt: Date;
  sentAt: Date | null;
  payload: JobPayload<"emails.send"> | Record<string, unknown>;
  payloadKind: string;
  subject: string;
  to: string;
  html: string;
};

type RawEmailJobRow = {
  id: string;
  status: Exclude<EmailJobStatus, "ALL">;
  attempts: number;
  dedupeKey: string | null;
  lastError: string | null;
  createdAt: Date;
  runAt: Date;
  sentAt: Date | null;
  payload: unknown;
};

async function withClient<T>(_connectionString: string, task: (client: PrismaClient) => Promise<T>) {
  return withPrismaClient(task);
}

export async function listStations(args: {
  connectionString: string;
  limit?: number;
  search?: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const search = args.search ?? null;
    return client.$queryRaw<StationSummaryRow[]>`
        SELECT
          s.id,
          s.name,
          s.address,
          s.station_type AS "stationType",
          s.total_capacity AS "totalCapacity",
          s.return_slot_limit AS "returnSlotLimit",
          s.updated_at AS "updatedAt",
          COUNT(b.id)::int AS "totalBikes",
          COUNT(*) FILTER (WHERE b.status = 'AVAILABLE')::int AS "availableBikes",
          COUNT(*) FILTER (WHERE b.status = 'BOOKED')::int AS "bookedBikes",
          COUNT(*) FILTER (WHERE b.status = 'BROKEN')::int AS "brokenBikes",
          COUNT(*) FILTER (WHERE b.status = 'RESERVED')::int AS "reservedBikes",
          COUNT(*) FILTER (WHERE b.status = 'MAINTAINED')::int AS "maintainedBikes",
          COUNT(*) FILTER (WHERE b.status = 'UNAVAILABLE')::int AS "unavailableBikes"
        FROM "Station" s
        LEFT JOIN "Bike" b ON b."stationId" = s.id
        WHERE (${search}::text IS NULL OR s.id::text = ${search} OR s.name ILIKE '%' || ${search} || '%')
        GROUP BY s.id
        ORDER BY s.name ASC
        LIMIT ${args.limit ?? 25}
      `;
  });
}

export async function getStationInspection(args: {
  connectionString: string;
  value: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const stationRows = await client.$queryRaw<StationSummaryRow[]>`
        SELECT
          s.id,
          s.name,
          s.address,
          s.station_type AS "stationType",
          s.total_capacity AS "totalCapacity",
          s.return_slot_limit AS "returnSlotLimit",
          s.updated_at AS "updatedAt",
          COUNT(b.id)::int AS "totalBikes",
          COUNT(*) FILTER (WHERE b.status = 'AVAILABLE')::int AS "availableBikes",
          COUNT(*) FILTER (WHERE b.status = 'BOOKED')::int AS "bookedBikes",
          COUNT(*) FILTER (WHERE b.status = 'BROKEN')::int AS "brokenBikes",
          COUNT(*) FILTER (WHERE b.status = 'RESERVED')::int AS "reservedBikes",
          COUNT(*) FILTER (WHERE b.status = 'MAINTAINED')::int AS "maintainedBikes",
          COUNT(*) FILTER (WHERE b.status = 'UNAVAILABLE')::int AS "unavailableBikes"
        FROM "Station" s
        LEFT JOIN "Bike" b ON b."stationId" = s.id
        WHERE s.id::text = ${args.value} OR s.name ILIKE '%' || ${args.value} || '%'
        GROUP BY s.id
        ORDER BY
          CASE
            WHEN s.id::text = ${args.value} THEN 0
            WHEN s.name = ${args.value} THEN 1
            ELSE 2
          END,
          s.updated_at DESC
        LIMIT 1
      `;

    const station = stationRows[0] ?? null;
    if (!station) {
      return null;
    }

    const bikes = await client.$queryRaw<StationBikeRow[]>`
        SELECT
          b.id,
          b.bike_number AS "bikeNumber",
          b.chip_id AS "chipId",
          b.status,
          b.updated_at AS "updatedAt",
          (
            SELECT r.id
            FROM "Rental" r
            WHERE r.bike_id = b.id AND r.status = 'RENTED'
            ORDER BY r.start_time DESC
            LIMIT 1
          ) AS "activeRentalId",
          (
            SELECT res.id
            FROM "Reservation" res
            WHERE res.bike_id = b.id AND res.status = 'PENDING'
            ORDER BY res.created_at DESC
            LIMIT 1
          ) AS "pendingReservationId"
        FROM "Bike" b
        WHERE b."stationId" = ${station.id}::uuid
        ORDER BY b.bike_number ASC
      `;

    return {
      ...station,
      bikes,
    } satisfies StationInspection;
  });
}

export async function getBikeInspection(args: {
  connectionString: string;
  value: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const bikeRows = await client.$queryRaw<Array<Omit<BikeInspection, "recentRentals">>>`
        SELECT
          b.id,
          b.bike_number AS "bikeNumber",
          b.chip_id AS "chipId",
          b.status,
          b."stationId" AS "stationId",
          s.name AS "stationName",
          s.address AS "stationAddress",
          b."supplierId" AS "supplierId",
          sup.name AS "supplierName",
          b.created_at AS "createdAt",
          b.updated_at AS "updatedAt",
          (
            SELECT r.id
            FROM "Rental" r
            WHERE r.bike_id = b.id AND r.status = 'RENTED'
            ORDER BY r.start_time DESC
            LIMIT 1
          ) AS "activeRentalId",
          (
            SELECT res.id
            FROM "Reservation" res
            WHERE res.bike_id = b.id AND res.status = 'PENDING'
            ORDER BY res.created_at DESC
            LIMIT 1
          ) AS "pendingReservationId"
        FROM "Bike" b
        LEFT JOIN "Station" s ON s.id = b."stationId"
        LEFT JOIN "Supplier" sup ON sup.id = b."supplierId"
        WHERE b.id::text = ${args.value} OR b.bike_number ILIKE '%' || ${args.value} || '%' OR b.chip_id ILIKE '%' || ${args.value} || '%'
        ORDER BY
          CASE
            WHEN b.id::text = ${args.value} THEN 0
            WHEN b.bike_number = ${args.value} THEN 1
            WHEN b.chip_id = ${args.value} THEN 2
            ELSE 3
          END,
          b.updated_at DESC
        LIMIT 1
      `;

    const bike = bikeRows[0] ?? null;
    if (!bike) {
      return null;
    }

    const recentRentals = await client.$queryRaw<BikeRentalSnapshot[]>`
        SELECT
          r.id,
          r.status,
          r.start_time AS "startTime",
          r.end_time AS "endTime",
          u.id AS "userId",
          u.email AS "userEmail"
        FROM "Rental" r
        INNER JOIN users u ON u.id = r.user_id
        WHERE r.bike_id = ${bike.id}::uuid
        ORDER BY r.start_time DESC
        LIMIT 5
      `;

    return {
      ...bike,
      recentRentals,
    } satisfies BikeInspection;
  });
}

export async function listActiveRentals(args: {
  connectionString: string;
  limit?: number;
}) {
  return withClient(args.connectionString, async (client) => {
    return client.$queryRaw<ActiveRentalInspectorRow[]>`
        SELECT
          r.id,
          r.user_id AS "userId",
          u.email AS "userEmail",
          r.bike_id AS "bikeId",
          b.bike_number AS "bikeNumber",
          b.chip_id AS "bikeChipId",
          r.start_station AS "startStationId",
          s.name AS "startStationName",
          r.start_time AS "startTime",
          r.status
        FROM "Rental" r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN "Bike" b ON b.id = r.bike_id
        INNER JOIN "Station" s ON s.id = r.start_station
        WHERE r.status = 'RENTED'
        ORDER BY r.start_time DESC
        LIMIT ${args.limit ?? 25}
      `;
  });
}

export async function listPersonaRentalHistory(args: {
  connectionString: string;
  userId: string;
  limit?: number;
  status?: "RENTED" | "COMPLETED" | "CANCELLED";
}) {
  return withClient(args.connectionString, async (client) => {
    const status = args.status ?? null;
    return client.$queryRaw<PersonaRentalHistoryRow[]>`
        SELECT
          r.id,
          r.status,
          r.bike_id AS "bikeId",
          b.bike_number AS "bikeNumber",
          b.chip_id AS "bikeChipId",
          r.start_station AS "startStationId",
          start_station.name AS "startStationName",
          r.end_station AS "endStationId",
          end_station.name AS "endStationName",
          r.start_time AS "startTime",
          r.end_time AS "endTime",
          r.duration AS "durationMinutes",
          CASE WHEN r.total_price IS NULL THEN NULL ELSE r.total_price::float8 END AS "totalPrice",
          r.updated_at AS "updatedAt"
        FROM "Rental" r
        INNER JOIN "Bike" b ON b.id = r.bike_id
        INNER JOIN "Station" start_station ON start_station.id = r.start_station
        LEFT JOIN "Station" end_station ON end_station.id = r.end_station
        WHERE r.user_id = ${args.userId}::uuid
          AND (${status}::text IS NULL OR r.status = ${status})
        ORDER BY r.start_time DESC, r.created_at DESC
        LIMIT ${args.limit ?? 20}
      `;
  });
}

export async function getPersonaRentalDetail(args: {
  connectionString: string;
  userId: string;
  rentalId: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const rows = await client.$queryRaw<PersonaRentalDetail[]>`
        SELECT
          r.id,
          r.user_id AS "userId",
          u.email AS "userEmail",
          r.status,
          r.bike_id AS "bikeId",
          b.bike_number AS "bikeNumber",
          b.chip_id AS "bikeChipId",
          b.status AS "bikeStatus",
          r.start_station AS "startStationId",
          start_station.name AS "startStationName",
          start_station.address AS "startStationAddress",
          r.end_station AS "endStationId",
          end_station.name AS "endStationName",
          end_station.address AS "endStationAddress",
          r.start_time AS "startTime",
          r.end_time AS "endTime",
          r.duration AS "durationMinutes",
          CASE WHEN r.total_price IS NULL THEN NULL ELSE r.total_price::float8 END AS "totalPrice",
          r.subscription_id AS "subscriptionId",
          r.updated_at AS "updatedAt",
          rc.confirmed_at AS "returnConfirmedAt",
          rc.confirmation_method AS "returnConfirmationMethod",
          rc.handover_status AS "returnHandoverStatus",
          rc.confirmed_by_user_id AS "returnConfirmedByUserId",
          confirmed_by.email AS "returnConfirmedByUserEmail",
          rc.station_id AS "returnConfirmationStationId",
          confirmation_station.name AS "returnConfirmationStationName",
          CASE WHEN rbr.total_amount IS NULL THEN NULL ELSE rbr.total_amount::float8 END AS "billedTotalAmount",
          CASE WHEN rbr.base_amount IS NULL THEN NULL ELSE rbr.base_amount::float8 END AS "billedBaseAmount",
          CASE WHEN rbr.overtime_amount IS NULL THEN NULL ELSE rbr.overtime_amount::float8 END AS "billedOvertimeAmount",
          CASE WHEN rbr.coupon_discount_amount IS NULL THEN NULL ELSE rbr.coupon_discount_amount::float8 END AS "billedCouponDiscountAmount",
          CASE WHEN rbr.subscription_discount_amount IS NULL THEN NULL ELSE rbr.subscription_discount_amount::float8 END AS "billedSubscriptionDiscountAmount",
          rbr.deposit_forfeited AS "billedDepositForfeited",
          penalties.total_amount AS "penaltiesTotalAmount",
          penalties.count AS "penaltiesCount"
        FROM "Rental" r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN "Bike" b ON b.id = r.bike_id
        INNER JOIN "Station" start_station ON start_station.id = r.start_station
        LEFT JOIN "Station" end_station ON end_station.id = r.end_station
        LEFT JOIN return_confirmations rc ON rc.rental_id = r.id
        LEFT JOIN users confirmed_by ON confirmed_by.id = rc.confirmed_by_user_id
        LEFT JOIN "Station" confirmation_station ON confirmation_station.id = rc.station_id
        LEFT JOIN rental_billing_records rbr ON rbr.rental_id = r.id
        LEFT JOIN (
          SELECT
            rental_id,
            COUNT(*)::int AS count,
            COALESCE(SUM(amount)::float8, 0) AS total_amount
          FROM rental_penalties
          GROUP BY rental_id
        ) penalties ON penalties.rental_id = r.id
        WHERE r.user_id = ${args.userId}::uuid
          AND r.id = ${args.rentalId}::uuid
        LIMIT 1
      `;

    return rows[0] ?? null;
  });
}

export async function confirmRentalReturnAsStaff(args: {
  connectionString: string;
  rentalId: string;
  staffUserId: string;
  stationId: string;
}) {
  return confirmRentalReturnByStaff({
    rentalId: args.rentalId,
    staffUserId: args.staffUserId,
    stationId: args.stationId,
  });
}

export async function listEmailJobs(args: {
  connectionString: string;
  status: EmailJobStatus;
  limit?: number;
}) {
  return withClient(args.connectionString, async (client) => {
    const rows = await client.$queryRaw<RawEmailJobRow[]>`
        SELECT
          id,
          status,
          attempts,
          dedupe_key AS "dedupeKey",
          last_error AS "lastError",
          created_at AS "createdAt",
          run_at AS "runAt",
          sent_at AS "sentAt",
          payload
        FROM job_outbox
        WHERE type = ${EMAIL_JOB_TYPE}
          AND (${args.status} = 'ALL' OR status = ${args.status})
        ORDER BY created_at DESC
        LIMIT ${args.limit ?? 30}
      `;

    return rows.map((row) => {
      const parsed = safeParseJobPayload(EMAIL_JOB_TYPE, row.payload);
      if (parsed.success) {
        const summary = summarizePayload(parsed.data);
        return {
          ...row,
          payload: parsed.data,
          payloadKind: parsed.data.kind,
          subject: summary.subject,
          to: parsed.data.to,
          html: summary.html,
        } satisfies EmailJobRow;
      }

      const payload = (row.payload && typeof row.payload === "object")
        ? row.payload as Record<string, unknown>
        : {};

      return {
        ...row,
        payload,
        payloadKind: typeof payload.kind === "string" ? payload.kind : "unknown",
        subject: typeof payload.subject === "string" ? payload.subject : "(invalid payload)",
        to: typeof payload.to === "string" ? payload.to : "(invalid payload)",
        html: typeof payload.html === "string" ? payload.html : "",
      } satisfies EmailJobRow;
    });
  });
}

export async function processOneEmailJob() {
  const { processEmailOnce } = await import("../worker/commands/process-email-once");
  return processEmailOnce();
}

export async function sendSampleEmails(args: { to: string }) {
  const [{ makeEmailTransporter }, templates] = await Promise.all([
    import("../lib/email"),
    import("../lib/email-templates"),
  ]);

  const email = makeEmailTransporter({ fromName: "MeBike" });
  await email.transporter.verify();

  const samples = [
    templates.buildAuthOtpEmail({
      kind: "auth.verifyOtp",
      fullName: "An Nguyen",
      otp: "123456",
      expiresInMinutes: 10,
    }),
    templates.buildAuthOtpEmail({
      kind: "auth.resetOtp",
      fullName: "An Nguyen",
      otp: "654321",
      expiresInMinutes: 10,
    }),
    templates.buildSubscriptionCreatedEmail({
      fullName: "An Nguyen",
      packageName: "Goi Thang Thu Nghiem",
      price: 99000,
      maxUsages: 30,
      createdOn: "15/04/2026",
    }),
    templates.buildFixedSlotAssignedEmail({
      fullName: "An Nguyen",
      stationName: "Tram Ben Thanh",
      slotDateLabel: "16/04/2026",
      slotTimeLabel: "09:00",
    }),
    templates.buildFixedSlotNoBikeEmail({
      fullName: "An Nguyen",
      stationName: "Tram Ben Thanh",
      slotDateLabel: "16/04/2026",
      slotTimeLabel: "09:00",
    }),
    templates.buildFixedSlotBillingFailedEmail({
      fullName: "An Nguyen",
      stationName: "Tram Ben Thanh",
      slotDateLabel: "16/04/2026",
      slotTimeLabel: "09:00",
      reason: "INSUFFICIENT_BALANCE",
    }),
    templates.buildReservationConfirmedEmail({
      fullName: "An Nguyen",
      stationName: "Tram Nha Hat",
      bikeId: "MB-102",
      startTimeLabel: "16/04/2026 08:45",
      endTimeLabel: "16/04/2026 09:00",
    }),
    templates.buildReservationNearExpiryEmail({
      fullName: "An Nguyen",
      stationName: "Tram Nha Hat",
      bikeId: "MB-102",
      minutesRemaining: 5,
    }),
    templates.buildReservationExpiredEmail({
      fullName: "An Nguyen",
      stationName: "Tram Nha Hat",
      bikeId: "MB-102",
      endTimeLabel: "16/04/2026 09:00",
    }),
    templates.buildAgencyApprovedEmail({
      agencyName: "Agency Demo",
      loginEmail: "agency.demo@mebike.vn",
      temporaryPassword: "TempPass!234",
    }),
  ];

  const sentSubjects: string[] = [];

  try {
    for (const [index, sample] of samples.entries()) {
      await email.transporter.sendMail({
        from: email.defaultFrom,
        to: args.to,
        subject: `[Sample ${index + 1}/${samples.length}] ${sample.subject}`,
        html: sample.html,
      });
      sentSubjects.push(sample.subject);
    }

    return sentSubjects;
  }
  finally {
    if (typeof email.transporter.close === "function") {
      email.transporter.close();
    }
  }
}

export async function getEmailJobById(args: {
  connectionString: string;
  id: string;
}) {
  const jobs = await listEmailJobs({
    connectionString: args.connectionString,
    status: "ALL",
    limit: 100,
  });

  return jobs.find(job => job.id === args.id) ?? null;
}

export function formatTimestamp(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizePayload(payload: JobPayload<"emails.send">) {
  switch (payload.kind) {
    case "raw":
      return {
        subject: payload.subject,
        html: payload.html,
      };
    case "auth.verifyOtp":
      return {
        subject: "Verify OTP",
        html: `OTP ${payload.otp} for ${payload.fullName}. Expires in ${payload.expiresInMinutes} minutes.`,
      };
    case "auth.resetOtp":
      return {
        subject: "Reset password OTP",
        html: `OTP ${payload.otp} for ${payload.fullName}. Expires in ${payload.expiresInMinutes} minutes.`,
      };
  }
}
