import type { FixedSlotAssignmentTemplateRow } from "../../models";

export type FixedSlotAssignmentSummary = {
  readonly slotDate: string;
  readonly totalTemplates: number;
  readonly assigned: number;
  readonly alreadyAssigned: number;
  readonly noBike: number;
  readonly conflicts: number;
};

export type FixedSlotAssignmentOutcome
  = | "ASSIGNED"
    | "ALREADY_ASSIGNED"
    | "NO_BIKE"
    | "CONFLICT";

export type FixedSlotAssignmentContext = {
  readonly slotDate: Date;
  readonly slotDateKey: string;
  readonly now: Date;
};

export type FixedSlotLabels = {
  readonly slotStartAt: Date;
  readonly slotDateLabel: string;
  readonly slotTimeLabel: string;
};

export type FixedSlotCounts = {
  assigned: number;
  alreadyAssigned: number;
  noBike: number;
  conflicts: number;
};

export type { FixedSlotAssignmentTemplateRow };
