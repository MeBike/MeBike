import type { PageRequest } from "@/domain/shared/pagination";
import type { AgencyRequestStatus } from "generated/prisma/client";

export type AgencyRequestActorRef = {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
};

export type AgencyRequestAgencyRef = {
  readonly id: string;
  readonly name: string;
};

export type AgencyRequestRow = {
  readonly id: string;
  readonly requesterUserId: string | null;
  readonly requesterEmail: string;
  readonly requesterPhone: string | null;
  readonly agencyName: string;
  readonly agencyAddress: string | null;
  readonly agencyContactPhone: string | null;
  readonly status: AgencyRequestStatus;
  readonly description: string | null;
  readonly reviewedByUserId: string | null;
  readonly reviewedAt: Date | null;
  readonly approvedAgencyId: string | null;
  readonly createdAgencyUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly requesterUser: AgencyRequestActorRef | null;
  readonly reviewedByUser: AgencyRequestActorRef | null;
  readonly approvedAgency: AgencyRequestAgencyRef | null;
  readonly createdAgencyUser: AgencyRequestActorRef | null;
};

export type SubmitAgencyRequestInput = {
  readonly requesterUserId?: string | null;
  readonly requesterEmail: string;
  readonly requesterPhone?: string | null;
  readonly agencyName: string;
  readonly agencyAddress?: string | null;
  readonly agencyContactPhone?: string | null;
  readonly description?: string | null;
};

export type ReviewAgencyRequestInput = {
  readonly reviewedByUserId: string;
  readonly description?: string | null;
};

export type ApproveAgencyRequestInput = ReviewAgencyRequestInput;

export type FinalizeAgencyRequestApprovalInput = ReviewAgencyRequestInput & {
  readonly approvedAgencyId: string;
  readonly createdAgencyUserId: string;
};

export type AgencyRequestFilter = {
  readonly requesterUserId?: string;
  readonly requesterEmail?: string;
  readonly agencyName?: string;
  readonly status?: AgencyRequestStatus;
};

export type AgencyRequestSortField
  = "createdAt"
    | "updatedAt"
    | "status"
    | "requesterEmail"
    | "agencyName";

export type AgencyRequestPageRequest = PageRequest<AgencyRequestSortField>;
