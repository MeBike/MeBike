export const JobTypes = {
  EmailSend: "emails.send",
  PushSend: "notifications.push.send",
  SubscriptionAutoActivate: "subscriptions.autoActivate",
  SubscriptionExpireSweep: "subscriptions.expireSweep",
  ReservationFixedSlotAssign: "reservations.fixedSlotAssign",
  ReservationNotifyNearExpiry: "reservations.notifyNearExpiry",
  ReservationExpireHold: "reservations.expireHold",
  EnvironmentImpactCalculateRental: "environment.impact.calculateRental",
  RentalOverdueSweep: "rentals.overdueSweep",
  WalletWithdrawalExecute: "wallets.withdraw.execute",
  WalletWithdrawalSweep: "wallets.withdraw.sweep",
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];
