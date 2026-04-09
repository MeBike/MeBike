import type { AgencyRow } from "@/domain/agencies/models";
import type {
  AgencyRequestRow,
  ReviewAgencyRequestInput,
  SubmitAgencyRequestInput,
} from "@/domain/agency-requests/models";
import type { UserRow } from "@/domain/users/models";

export type ProvisionAgencyAccountApprovalInput = ReviewAgencyRequestInput;

export type ProvisionAgencyAccountFromAdminInput = SubmitAgencyRequestInput
  & ProvisionAgencyAccountApprovalInput;

export type ProvisionAgencyAccountResult = {
  readonly agency: AgencyRow;
  readonly agencyRequest: AgencyRequestRow;
  readonly user: UserRow;
};
