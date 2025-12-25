export const JobTypes = {
  SubscriptionAutoActivate: "subscriptions.autoActivate",
  SubscriptionExpireSweep: "subscriptions.expireSweep",
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];
