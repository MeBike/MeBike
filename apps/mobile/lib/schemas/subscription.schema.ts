import { z } from "zod";

import { PaginationMetaSchema } from "./stations.schema";

const NumberLike = z.union([z.number(), z.string()]);

export const PackageGraphqlSchema = z.looseObject({
  id: z.string(),
  name: z.string().optional(),
  price: NumberLike.optional(),
  maxUsages: z.number().nullable().optional(),
  usageType: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type PackageGraphql = z.infer<typeof PackageGraphqlSchema>;

export const SubscriptionGraphqlSchema = z.looseObject({
  id: z.string(),
  status: z.string().optional(),
  activatedAt: z.string().nullable().optional(),
  expiredAt: z.string().nullable().optional(),
  usageCounts: z.number().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  package: PackageGraphqlSchema.nullable().optional(),
});

export type SubscriptionGraphql = z.infer<typeof SubscriptionGraphqlSchema>;

const PackagesEnvelopeSchema = z.looseObject({
  success: z.boolean().optional(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  errors: z.array(z.string()).nullable().optional(),
  data: z.array(PackageGraphqlSchema).optional(),
  pagination: PaginationMetaSchema.optional(),
});

const SubscriptionsEnvelopeSchema = z.looseObject({
  success: z.boolean().optional(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  errors: z.array(z.string()).nullable().optional(),
  data: z.array(SubscriptionGraphqlSchema).optional(),
  pagination: PaginationMetaSchema.optional(),
});

const SubscriptionDetailEnvelopeSchema = z.looseObject({
  success: z.boolean().optional(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  errors: z.array(z.string()).nullable().optional(),
  data: SubscriptionGraphqlSchema.nullable().optional(),
});

export const PackagesResponseSchema = z.looseObject({
  data: z
    .looseObject({
      Packages: PackagesEnvelopeSchema.optional(),
    })
    .optional(),
});

export const SubscriptionsResponseSchema = z.looseObject({
  data: z
    .looseObject({
      Subscriptions: SubscriptionsEnvelopeSchema.optional(),
    })
    .optional(),
});

export const SubscriptionDetailResponseSchema = z.looseObject({
  data: z
    .looseObject({
      Subscription: SubscriptionDetailEnvelopeSchema.optional(),
    })
    .optional(),
});

export const CreateSubscriptionResponseSchema = z.looseObject({
  data: z
    .looseObject({
      CreateSubscription: SubscriptionDetailEnvelopeSchema.optional(),
    })
    .optional(),
});

export const ActivateSubscriptionResponseSchema = z.looseObject({
  data: z
    .looseObject({
      ActivateSubscription: SubscriptionDetailEnvelopeSchema.optional(),
    })
    .optional(),
});
