export const JobTypes = {
  EmailSend: "emails.send",
  SubscriptionAutoActivate: "subscriptions.autoActivate",
  SubscriptionExpireSweep: "subscriptions.expireSweep",
  ReservationFixedSlotAssign: "reservations.fixedSlotAssign",
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];
