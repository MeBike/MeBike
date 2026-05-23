import { z } from "../../../../zod";

export const SystemConfigSchema = z.object({
  key: z.string().openapi({
    description: "Configuration key",
    example: "min_available_bikes_at_station",
  }),
  value: z.string().openapi({
    description: "Configuration value",
    example: "10",
  }),
  createdAt: z.string().openapi({
    description: "Creation timestamp",
  }),
  updatedAt: z.string().openapi({
    description: "Last update timestamp",
  }),
}).openapi("SystemConfig");

export const UpdateSystemConfigBodySchema = z.object({
  value: z.string().trim().min(1).openapi({
    description: "Updated configuration value string",
    example: "12",
  }),
}).openapi("UpdateSystemConfigBody");

export const SystemConfigKeyParamSchema = z.object({
  key: z.string().min(1).openapi({
    description: "Configuration key",
    example: "min_available_bikes_at_station",
  }),
}).openapi("SystemConfigKeyParam");

export type UpdateSystemConfigBody = z.infer<typeof UpdateSystemConfigBodySchema>;

