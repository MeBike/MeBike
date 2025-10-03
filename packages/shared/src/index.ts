import { z } from "./zod";

export * from "./contracts/iot-service";
export * from "./iot/topics";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export * from "./abstract/index.js";
export * from "./constants/index.js";
export * from "./filters/index.js";
export * from "./interfaces/index.js";
export * from "./jwt/index.js";
export * from "./utils/index.js";

export type User = z.infer<typeof UserSchema>;
