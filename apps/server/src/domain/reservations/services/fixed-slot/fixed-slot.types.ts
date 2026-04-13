import type { FixedSlotAssignmentTemplateRow } from "../../models";

export type FixedSlotAssignmentSummary = {
  readonly slotDate: string;
  readonly totalTemplates: number;
  readonly assigned: number;
  readonly noBike: number;
  readonly missingReservation: number;
  readonly conflicts: number;
};

export type FixedSlotAssignmentOutcome
  = | "ASSIGNED"
    | "NO_BIKE"
    | "MISSING_RESERVATION"
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
  noBike: number;
  missingReservation: number;
  conflicts: number;
};

export type { FixedSlotAssignmentTemplateRow };
