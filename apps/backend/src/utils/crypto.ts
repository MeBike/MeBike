import bcrypt from "bcryptjs";
import { config } from "dotenv";
// import { createHash } from "node:crypto";

config();

// function sha256(content: string) {
//   return createHash("sha256").update(content).digest("hex");
// }

export function hashPassword(password: string) {
  // return bcrypt.hashSync(password, 10);
  // Nếu password đầu vào là undefined hoặc không phải string, hàm hashSync có thể báo lỗi
  if (!password || typeof password !== "string") {
    // xử lý lỗi ở đây thay vì trả về undefined
    throw new Error("Invalid password to hash");
  }
  const salt = bcrypt.genSaltSync(10); // Tạo salt
  const hash = bcrypt.hashSync(password, salt); // Hash mật khẩu
  return hash;
}
