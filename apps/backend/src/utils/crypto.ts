import bcrypt from "bcryptjs";
import { config } from "dotenv";
// import { createHash } from "node:crypto";

config();

// function sha256(content: string) {
//   return createHash("sha256").update(content).digest("hex");
// }

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}
