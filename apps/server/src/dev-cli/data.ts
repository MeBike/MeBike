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
  billedCouponDiscountAmount: number | null;
  billedSubscriptionDiscountAmount: number | null;
  billedDepositForfeited: boolean | null;
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

async function withClient<T>(_connectionString: string, task: (client: PrismaClient) => Promise<T>) {
  return withPrismaClient(task);
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toNumber(value: { toNumber: () => number } | number | null | undefined) {
  if (value == null) {
    return null;
  }

  return typeof value === "number" ? value : value.toNumber();
}

function summarizeBikeStatuses(bikes: Array<{ status: string }>) {
  return bikes.reduce((counts, bike) => {
    counts.totalBikes += 1;

    switch (bike.status) {
      case "AVAILABLE":
        counts.availableBikes += 1;
        break;
      case "BOOKED":
        counts.bookedBikes += 1;
        break;
      case "BROKEN":
        counts.brokenBikes += 1;
        break;
      case "RESERVED":
        counts.reservedBikes += 1;
        break;
      case "MAINTAINED":
        counts.maintainedBikes += 1;
        break;
      case "UNAVAILABLE":
        counts.unavailableBikes += 1;
        break;
    }

    return counts;
  }, {
    totalBikes: 0,
    availableBikes: 0,
    bookedBikes: 0,
    brokenBikes: 0,
    reservedBikes: 0,
    maintainedBikes: 0,
    unavailableBikes: 0,
  });
}

function toStationSummaryRow<T extends {
  id: string;
  name: string;
  address: string;
  stationType: string;
  totalCapacity: number;
  returnSlotLimit: number;
  updatedAt: Date;
  bikes: Array<{ status: string }>;
}>(station: T) {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    stationType: station.stationType as StationSummaryRow["stationType"],
    totalCapacity: station.totalCapacity,
    returnSlotLimit: station.returnSlotLimit,
    updatedAt: station.updatedAt,
    ...summarizeBikeStatuses(station.bikes),
  } satisfies StationSummaryRow;
}

type StationInspectionRecord = {
  id: string;
  name: string;
  address: string;
  stationType: string;
  totalCapacity: number;
  returnSlotLimit: number;
  updatedAt: Date;
  bikes: Array<{
    id: string;
    bikeNumber: string;
    status: string;
    updatedAt: Date;
    rentals: Array<{ id: string }>;
    reservations: Array<{ id: string }>;
  }>;
};

const stationInspectionSelect = {
  id: true,
  name: true,
  address: true,
  stationType: true,
  totalCapacity: true,
  returnSlotLimit: true,
  updatedAt: true,
  bikes: {
    orderBy: { bikeNumber: "asc" },
    select: {
      id: true,
      bikeNumber: true,
      status: true,
      updatedAt: true,
      rentals: {
        where: { status: "RENTED" },
        orderBy: { startTime: "desc" },
        take: 1,
        select: { id: true },
      },
      reservations: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  },
} as const;

type BikeInspectionRecord = {
  id: string;
  bikeNumber: string;
  status: string;
  stationId: string | null;
  supplierId: string | null;
  createdAt: Date;
  updatedAt: Date;
  station: {
    name: string;
    address: string;
  } | null;
  supplier: {
    name: string;
  } | null;
  rentals: Array<{ id: string }>;
  reservations: Array<{ id: string }>;
};

const bikeInspectionBaseSelect = {
  id: true,
  bikeNumber: true,
  status: true,
  stationId: true,
  supplierId: true,
  createdAt: true,
  updatedAt: true,
  station: {
    select: {
      name: true,
      address: true,
    },
  },
  supplier: {
    select: {
      name: true,
    },
  },
  rentals: {
    where: { status: "RENTED" },
    orderBy: { startTime: "desc" },
    take: 1,
    select: { id: true },
  },
  reservations: {
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { id: true },
  },
} as const;

async function findStationByInspectableValue(client: PrismaClient, value: string): Promise<StationInspectionRecord | null> {
  if (looksLikeUuid(value)) {
    const byId = await client.station.findUnique({
      where: { id: value },
      select: stationInspectionSelect,
    });

    if (byId) {
      return byId;
    }
  }

  const byExactName = await client.station.findFirst({
    where: { name: { equals: value, mode: "insensitive" } },
    select: stationInspectionSelect,
  });

  if (byExactName) {
    return byExactName;
  }

  return client.station.findFirst({
    where: { name: { contains: value, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    select: stationInspectionSelect,
  });
}

async function findBikeByInspectableValue(client: PrismaClient, value: string): Promise<BikeInspectionRecord | null> {
  if (looksLikeUuid(value)) {
    const byId = await client.bike.findUnique({
      where: { id: value },
      select: bikeInspectionBaseSelect,
    });

    if (byId) {
      return byId;
    }
  }

  const byExactBikeNumber = await client.bike.findFirst({
    where: { bikeNumber: { equals: value, mode: "insensitive" } },
    select: bikeInspectionBaseSelect,
  });

  if (byExactBikeNumber) {
    return byExactBikeNumber;
  }

  return client.bike.findFirst({
    where: { bikeNumber: { contains: value, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    select: bikeInspectionBaseSelect,
  });
}

export async function listStations(args: {
  connectionString: string;
  limit?: number;
  search?: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const search = args.search?.trim();
    const stations = await client.station.findMany({
      where: search
        ? {
            OR: [
              ...(looksLikeUuid(search) ? [{ id: search }] : []),
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
      take: args.limit ?? 25,
      select: {
        id: true,
        name: true,
        address: true,
        stationType: true,
        totalCapacity: true,
        returnSlotLimit: true,
        updatedAt: true,
        bikes: {
          select: { status: true },
        },
      },
    });

    return stations.map(toStationSummaryRow);
  });
}

export async function getStationInspection(args: {
  connectionString: string;
  value: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const station = await findStationByInspectableValue(client, args.value);
    if (!station) {
      return null;
    }

    return {
      ...toStationSummaryRow(station),
      bikes: station.bikes.map(bike => ({
        id: bike.id,
        bikeNumber: bike.bikeNumber,
        status: bike.status,
        updatedAt: bike.updatedAt,
        activeRentalId: bike.rentals[0]?.id ?? null,
        pendingReservationId: bike.reservations[0]?.id ?? null,
      } satisfies StationBikeRow)),
    } satisfies StationInspection;
  });
}

export async function getBikeInspection(args: {
  connectionString: string;
  value: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const bike = await findBikeByInspectableValue(client, args.value);
    if (!bike) {
      return null;
    }

    const recentRentals = await client.rental.findMany({
      where: { bikeId: bike.id },
      orderBy: { startTime: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return {
      id: bike.id,
      bikeNumber: bike.bikeNumber,
      status: bike.status,
      stationId: bike.stationId,
      stationName: bike.station?.name ?? null,
      stationAddress: bike.station?.address ?? null,
      supplierId: bike.supplierId,
      supplierName: bike.supplier?.name ?? null,
      createdAt: bike.createdAt,
      updatedAt: bike.updatedAt,
      activeRentalId: bike.rentals[0]?.id ?? null,
      pendingReservationId: bike.reservations[0]?.id ?? null,
      recentRentals: recentRentals.map(rental => ({
        id: rental.id,
        status: rental.status,
        startTime: rental.startTime,
        endTime: rental.endTime,
        userId: rental.userId,
        userEmail: rental.user.email,
      } satisfies BikeRentalSnapshot)),
    } satisfies BikeInspection;
  });
}

export async function listActiveRentals(args: {
  connectionString: string;
  limit?: number;
}) {
  return withClient(args.connectionString, async (client) => {
    const rentals = await client.rental.findMany({
      where: { status: "RENTED" },
      orderBy: { startTime: "desc" },
      take: args.limit ?? 25,
      select: {
        id: true,
        userId: true,
        user: { select: { email: true } },
        bikeId: true,
        bike: { select: { bikeNumber: true } },
        startStationId: true,
        startStation: { select: { name: true } },
        startTime: true,
        status: true,
      },
    });

    return rentals.map(rental => ({
      id: rental.id,
      userId: rental.userId,
      userEmail: rental.user.email,
      bikeId: rental.bikeId,
      bikeNumber: rental.bike.bikeNumber,
      startStationId: rental.startStationId,
      startStationName: rental.startStation.name,
      startTime: rental.startTime,
      status: rental.status,
    } satisfies ActiveRentalInspectorRow));
  });
}

export async function listPersonaRentalHistory(args: {
  connectionString: string;
  userId: string;
  limit?: number;
  status?: "RENTED" | "COMPLETED" | "OVERDUE_UNRETURNED";
}) {
  return withClient(args.connectionString, async (client) => {
    const rentals = await client.rental.findMany({
      where: {
        userId: args.userId,
        ...(args.status ? { status: args.status } : {}),
      },
      orderBy: [{ startTime: "desc" }, { createdAt: "desc" }],
      take: args.limit ?? 20,
      select: {
        id: true,
        status: true,
        bikeId: true,
        bike: { select: { bikeNumber: true } },
        startStationId: true,
        startStation: { select: { name: true } },
        endStationId: true,
        endStation: { select: { name: true } },
        startTime: true,
        endTime: true,
        duration: true,
        totalPrice: true,
        updatedAt: true,
      },
    });

    return rentals.map(rental => ({
      id: rental.id,
      status: rental.status,
      bikeId: rental.bikeId,
      bikeNumber: rental.bike.bikeNumber,
      startStationId: rental.startStationId,
      startStationName: rental.startStation.name,
      endStationId: rental.endStationId,
      endStationName: rental.endStation?.name ?? null,
      startTime: rental.startTime,
      endTime: rental.endTime,
      durationMinutes: rental.duration,
      totalPrice: toNumber(rental.totalPrice),
      updatedAt: rental.updatedAt,
    } satisfies PersonaRentalHistoryRow));
  });
}

export async function getPersonaRentalDetail(args: {
  connectionString: string;
  userId: string;
  rentalId: string;
}) {
  return withClient(args.connectionString, async (client) => {
    const rental = await client.rental.findFirst({
      where: {
        id: args.rentalId,
        userId: args.userId,
      },
      select: {
        id: true,
        userId: true,
        user: { select: { email: true } },
        status: true,
        bikeId: true,
        bike: { select: { bikeNumber: true, status: true } },
        startStationId: true,
        startStation: { select: { name: true, address: true } },
        endStationId: true,
        endStation: { select: { name: true, address: true } },
        startTime: true,
        endTime: true,
        duration: true,
        totalPrice: true,
        subscriptionId: true,
        updatedAt: true,
        returnConfirmation: {
          select: {
            confirmedAt: true,
            confirmationMethod: true,
            handoverStatus: true,
            confirmedByUserId: true,
            confirmedByUser: { select: { email: true } },
            stationId: true,
            station: { select: { name: true } },
          },
        },
        rentalBillingRecord: {
          select: {
            totalAmount: true,
            baseAmount: true,
            couponDiscountAmount: true,
            subscriptionDiscountAmount: true,
            depositForfeited: true,
          },
        },
      },
    });

    if (!rental) {
      return null;
    }

    return {
      id: rental.id,
      userId: rental.userId,
      userEmail: rental.user.email,
      status: rental.status,
      bikeId: rental.bikeId,
      bikeNumber: rental.bike.bikeNumber,
      bikeStatus: rental.bike.status,
      startStationId: rental.startStationId,
      startStationName: rental.startStation.name,
      startStationAddress: rental.startStation.address,
      endStationId: rental.endStationId,
      endStationName: rental.endStation?.name ?? null,
      endStationAddress: rental.endStation?.address ?? null,
      startTime: rental.startTime,
      endTime: rental.endTime,
      durationMinutes: rental.duration,
      totalPrice: toNumber(rental.totalPrice),
      subscriptionId: rental.subscriptionId,
      updatedAt: rental.updatedAt,
      returnConfirmedAt: rental.returnConfirmation?.confirmedAt ?? null,
      returnConfirmationMethod: rental.returnConfirmation?.confirmationMethod ?? null,
      returnHandoverStatus: rental.returnConfirmation?.handoverStatus ?? null,
      returnConfirmedByUserId: rental.returnConfirmation?.confirmedByUserId ?? null,
      returnConfirmedByUserEmail: rental.returnConfirmation?.confirmedByUser.email ?? null,
      returnConfirmationStationId: rental.returnConfirmation?.stationId ?? null,
      returnConfirmationStationName: rental.returnConfirmation?.station?.name ?? null,
      billedTotalAmount: toNumber(rental.rentalBillingRecord?.totalAmount),
      billedBaseAmount: toNumber(rental.rentalBillingRecord?.baseAmount),
      billedCouponDiscountAmount: toNumber(rental.rentalBillingRecord?.couponDiscountAmount),
      billedSubscriptionDiscountAmount: toNumber(rental.rentalBillingRecord?.subscriptionDiscountAmount),
      billedDepositForfeited: rental.rentalBillingRecord?.depositForfeited ?? null,
    } satisfies PersonaRentalDetail;
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
    const rows = await client.jobOutbox.findMany({
      where: {
        type: EMAIL_JOB_TYPE,
        ...(args.status === "ALL" ? {} : { status: args.status }),
      },
      orderBy: { createdAt: "desc" },
      take: args.limit ?? 30,
      select: {
        id: true,
        status: true,
        attempts: true,
        dedupeKey: true,
        lastError: true,
        createdAt: true,
        runAt: true,
        sentAt: true,
        payload: true,
      },
    });

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
