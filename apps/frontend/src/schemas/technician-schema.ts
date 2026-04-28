import * as z from "zod";
import { isValidUUID } from "@utils";
export const createTechnicianTeamSchema = z.object({
  name: z.string().min(1, { message: "Tên đội kỹ thuật không được để trống" }),
  stationId: z
    .string()
    .min(1, "Mã trạm không được để trống")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một UUID hợp lệ",
    }),
  availabilityStatus : z.enum(["AVAILABLE","UNAVAILABLE"]),  
});
export const updateTechnicianTeamSchema = z.object({
  name: z.string().min(1, { message: "Tên đội kỹ thuật không được để trống" }),
  availabilityStatus : z.enum(["AVAILABLE","UNAVAILABLE"]),  
});
export type CreateTechnicianTeamSchema = z.infer<
  typeof createTechnicianTeamSchema
>;
export type UpdateTechnicianTeamSchema = z.infer<
  typeof updateTechnicianTeamSchema
>;
