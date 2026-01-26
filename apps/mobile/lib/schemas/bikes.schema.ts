import { z } from "zod";

import { PaginationMetaSchema } from "./stations.schema";

export const BikeGraphqlSchema = z.looseObject({
  id: z.string(),
  chipId: z.string(),
  status: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  station: z
    .looseObject({
      id: z.string(),
      name: z.string().optional(),
      address: z.string().optional(),
    })
    .nullable()
    .optional(),
  supplier: z
    .looseObject({
      id: z.string(),
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const BikesEnvelopeSchema = z.looseObject({
  success: z.boolean().optional(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  errors: z.array(z.string()).nullable().optional(),
  data: z.array(BikeGraphqlSchema).optional(),
  pagination: PaginationMetaSchema.optional(),
});

const BikeDetailEnvelopeSchema = z.looseObject({
  success: z.boolean().optional(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  errors: z.array(z.string()).nullable().optional(),
  data: BikeGraphqlSchema.nullable().optional(),
});

export const BikesResponseSchema = z.looseObject({
  data: z
    .looseObject({
      Bikes: BikesEnvelopeSchema.optional(),
    })
    .optional(),
});

export const BikeDetailResponseSchema = z.looseObject({
  data: z
    .looseObject({
      Bike: BikeDetailEnvelopeSchema.optional(),
    })
    .optional(),
});
