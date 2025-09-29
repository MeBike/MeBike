import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export * from "./abstract/index.js";
export * from "./constants/index.js";
export * from "./consul/index.js";
export * from "./filters/grpc-exception.filter.js";
export * from "./graphql/index.js";
export * from "./interfaces/index.js";
export * from "./jwt/index.js";
export * from "./utils/index.js";
