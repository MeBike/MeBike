import { Effect } from "effect";
import crypto from "node:crypto";

import type { AgencyRequestRow } from "@/domain/agency-requests/models";
import type {
  StationAgencyAlreadyAssigned,
  StationAgencyForbidden,
  StationAgencyNotFound,
  StationAgencyRequired,
  StationCapacityLimitExceeded,
  StationCapacitySplitInvalid,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
} from "@/domain/stations/errors";
import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  InvalidOrgAssignment,
  StationRoleAssignmentLimitExceeded,
  TechnicianTeamMemberLimitExceeded,
} from "@/domain/users/domain-errors";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
  UserRole,
} from "generated/prisma/client";

import { makeAgencyRepository, makeAgencyService } from "@/domain/agencies";
import { makeAgencyRequestRepository } from "@/domain/agency-requests/repository/agency-request.repository";
import { hashPassword } from "@/domain/auth/services/auth.service";
import {
  makeStationCommandRepository,
  makeStationCommandService,
  makeStationQueryRepository,
} from "@/domain/stations";
import { makeTechnicianTeamQueryRepository } from "@/domain/technician-teams";
import { makeUserCommandRepository } from "@/domain/users/repository/user-command.repository";
import { makeUserQueryRepository } from "@/domain/users/repository/user-query.repository";
import { makeUserCommandService } from "@/domain/users/services/user-command.service";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { buildAgencyApprovedEmail } from "@/lib/email-templates";

import type {
  ProvisionAgencyAccountApprovalInput,
  ProvisionAgencyAccountFromAdminInput,
  ProvisionAgencyAccountResult,
} from "../models";

type AgencyAccountCredentials = {
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly fullName: string;
  readonly role: UserRole;
};

export type ProvisionAgencyAccountError
  = DuplicateUserEmail
    | DuplicateUserPhoneNumber
    | InvalidOrgAssignment
    | TechnicianTeamMemberLimitExceeded
    | StationRoleAssignmentLimitExceeded
    | StationNameAlreadyExists
    | StationOutsideSupportedArea
    | StationCapacityLimitExceeded
    | StationCapacitySplitInvalid
    | StationAgencyRequired
    | StationAgencyForbidden
    | StationAgencyNotFound
    | StationAgencyAlreadyAssigned
    | import("@/domain/agencies/domain-errors").AgencyRepositoryError
    | import("@/domain/agency-requests/domain-errors").AgencyRequestNotFound
    | import("@/domain/agency-requests/domain-errors").AgencyRequestRepositoryError
    | import("@/domain/agency-requests/domain-errors").InvalidAgencyRequestStatusTransition
    | import("@/lib/effect/prisma-tx").PrismaTransactionError;

export type AgencyAccountProvisionService = {
  readonly approveExistingRequest: (
    agencyRequest: AgencyRequestRow,
    input: ProvisionAgencyAccountApprovalInput,
  ) => Effect.Effect<ProvisionAgencyAccountResult, ProvisionAgencyAccountError>;
  readonly createFromAdmin: (
    input: ProvisionAgencyAccountFromAdminInput,
  ) => Effect.Effect<ProvisionAgencyAccountResult, ProvisionAgencyAccountError>;
};

export function makeAgencyAccountProvisionService(
  client: PrismaClient,
): AgencyAccountProvisionService {
  const provisionFromPendingRequestInTx = (
    tx: PrismaTypes.TransactionClient,
    agencyRequest: AgencyRequestRow,
    input: ProvisionAgencyAccountApprovalInput,
  ): Effect.Effect<ProvisionAgencyAccountResult, ProvisionAgencyAccountError> =>
    Effect.gen(function* () {
      const txAgencyRequestRepo = makeAgencyRequestRepository(tx);
      const txAgencyRepo = makeAgencyRepository(tx);
      const txAgencyService = makeAgencyService(txAgencyRepo);
      const txStationService = makeStationCommandService({
        agencyRepo: txAgencyRepo,
        commandRepo: makeStationCommandRepository(tx),
        queryRepo: makeStationQueryRepository(tx),
      });
      const txUserCommandService = makeUserCommandService({
        agencyRepo: txAgencyRepo,
        commandRepo: makeUserCommandRepository(tx),
        queryRepo: makeUserQueryRepository(tx),
        stationRepo: makeStationQueryRepository(tx),
        technicianTeamQueryRepo: makeTechnicianTeamQueryRepository(tx),
      });

      const createdAgency = yield* txAgencyService.create({
        name: agencyRequest.agencyName,
        contactPhone:
          agencyRequest.agencyContactPhone ?? agencyRequest.requesterPhone,
      });

      if (
        !agencyRequest.stationName
        || !agencyRequest.stationAddress
        || agencyRequest.stationLatitude == null
        || agencyRequest.stationLongitude == null
        || agencyRequest.stationTotalCapacity == null
      ) {
        return yield* Effect.die(
          new Error(
            `Agency request ${agencyRequest.id} is missing station metadata`,
          ),
        );
      }

      yield* txStationService.createStation({
        name: agencyRequest.stationName,
        address: agencyRequest.stationAddress,
        stationType: "AGENCY",
        agencyId: createdAgency.id,
        totalCapacity: agencyRequest.stationTotalCapacity,
        pickupSlotLimit:
          agencyRequest.stationPickupSlotLimit ?? agencyRequest.stationTotalCapacity,
        returnSlotLimit:
          agencyRequest.stationReturnSlotLimit ?? agencyRequest.stationTotalCapacity,
        latitude: agencyRequest.stationLatitude,
        longitude: agencyRequest.stationLongitude,
      });

      const credentials = yield* makeAgencyAccountCredentials({
        agencyId: createdAgency.id,
        agencyName: createdAgency.name,
      });

      const passwordHash = yield* hashPassword(credentials.password);
      const createdAgencyUser = yield* txUserCommandService.create({
        fullname: credentials.fullName,
        email: credentials.email,
        passwordHash,
        username: credentials.username,
        role: credentials.role,
        accountStatus: "ACTIVE",
        verify: "VERIFIED",
        orgAssignment: {
          agencyId: createdAgency.id,
        },
      });

      const updatedAgencyRequest = yield* txAgencyRequestRepo.approve(
        agencyRequest.id,
        {
          reviewedByUserId: input.reviewedByUserId,
          description: input.description,
          approvedAgencyId: createdAgency.id,
          createdAgencyUserId: createdAgencyUser.id,
        },
      );

      const approvalEmail = buildAgencyApprovedEmail({
        agencyName: createdAgency.name,
        loginEmail: credentials.email,
        temporaryPassword: credentials.password,
      });

      yield* enqueueOutboxJobInTx(tx, {
        type: JobTypes.EmailSend,
        dedupeKey: `agency-request-approved:${agencyRequest.id}`,
        payload: {
          version: 1,
          kind: "raw",
          to: agencyRequest.requesterEmail,
          subject: approvalEmail.subject,
          html: approvalEmail.html,
        },
        runAt: new Date(),
      });

      return {
        agency: createdAgency,
        agencyRequest: updatedAgencyRequest,
        user: createdAgencyUser,
      } as const;
    });

  return {
    approveExistingRequest: (agencyRequest, input) =>
      runPrismaTransaction(client, tx =>
        provisionFromPendingRequestInTx(tx, agencyRequest, input)),
    createFromAdmin: input => runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txAgencyRequestRepo = makeAgencyRequestRepository(tx);
        const pendingAgencyRequest = yield* txAgencyRequestRepo.submit({
          requesterUserId: input.requesterUserId ?? null,
          requesterEmail: input.requesterEmail,
          requesterPhone: input.requesterPhone ?? null,
          agencyName: input.agencyName,
          agencyAddress: input.agencyAddress ?? null,
          agencyContactPhone: input.agencyContactPhone ?? null,
          stationName: input.stationName,
          stationAddress: input.stationAddress,
          stationLatitude: input.stationLatitude,
          stationLongitude: input.stationLongitude,
          stationTotalCapacity: input.stationTotalCapacity,
          stationPickupSlotLimit:
            input.stationPickupSlotLimit ?? null,
          stationReturnSlotLimit:
            input.stationReturnSlotLimit ?? null,
          description: input.description ?? null,
        });

        return yield* provisionFromPendingRequestInTx(tx, pendingAgencyRequest, { reviewedByUserId: input.reviewedByUserId, description: input.description });
      })),
  };
}

function makeAgencyAccountCredentials(args: {
  agencyId: string;
  agencyName: string;
}): Effect.Effect<AgencyAccountCredentials> {
  return Effect.sync(() => {
    const compactAgencyId = args.agencyId.replace(/-/g, "");
    const username = `agency_${compactAgencyId}`;
    const email = `agency+${compactAgencyId}@accounts.mebike.local`;
    const password = `Mbk!${crypto.randomBytes(12).toString("base64url")}`;

    return {
      email,
      username,
      password,
      fullName: `Agency Admin - ${args.agencyName}`,
      role: "AGENCY",
    } as const;
  });
}
