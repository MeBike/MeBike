import * as z from "zod";

export const userProfileSchema = z.object({
  fullname: z.string(),
  email: z.email(),
  verify: z.string(),
  location: z.string(),
  username: z.string(),
  phone_number: z.string(),
  role: z.enum(["USER", "ADMIN", "STAFF"]),
  nfc_card_uid: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
