import type { FixedSlotAssignmentTemplateRow } from "../../models";

/** Tong hop ket qua worker fixed-slot cho mot ngay cu the. */
export type FixedSlotAssignmentSummary = {
  readonly slotDate: string;
  readonly totalTemplates: number;
  readonly assigned: number;
  readonly alreadyAssigned: number;
  readonly noBike: number;
  readonly billingFailed: number;
  readonly conflicts: number;
};

/** Ket qua assignment cua mot fixed-slot template trong worker run. */
export type FixedSlotAssignmentOutcome
  = | "ASSIGNED"
    | "ALREADY_ASSIGNED"
    | "BILLING_FAILED"
    | "NO_BIKE"
    | "CONFLICT";

/** Context chung duoc truyen xuyen suot mot lan worker xu ly fixed-slot. */
export type FixedSlotAssignmentContext = {
  readonly slotDate: Date;
  readonly slotDateKey: string;
  readonly now: Date;
};

/** Label va timestamp duoc derive tu date/time cua fixed-slot. */
export type FixedSlotLabels = {
  readonly slotStartAt: Date;
  readonly slotDateLabel: string;
  readonly slotTimeLabel: string;
};

/** Bo dem noi bo de cong don ket qua assignment. */
export type FixedSlotCounts = {
  assigned: number;
  alreadyAssigned: number;
  noBike: number;
  billingFailed: number;
  conflicts: number;
};

export type { FixedSlotAssignmentTemplateRow };
