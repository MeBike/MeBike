export const JobTypes = {
  EmailSend: "emails.send",
  SubscriptionAutoActivate: "subscriptions.autoActivate",
  SubscriptionExpireSweep: "subscriptions.expireSweep",
  ReservationFixedSlotAssign: "reservations.fixedSlotAssign",
  ReservationNotifyNearExpiry: "reservations.notifyNearExpiry",
  ReservationExpireHold: "reservations.expireHold",
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];
