import { z } from "./zod";

export * as IotService from "./contracts/iot-service";
export * from "./contracts/iot-service";
export * as BackendContracts from "./contracts/backend";
export * from "./contracts/backend";
export * as IotTopics from "./iot/topics";

export * from "./iot/topics";
export * as IotServiceSdk from "./sdk/iot-service";
export { getAllDevices } from "./sdk/iot-service";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
