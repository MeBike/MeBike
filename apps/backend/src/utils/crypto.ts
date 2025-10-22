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

export function generateOTP(length: number = 6): string {
  if (length <= 0) {
    throw new Error("OTP length must be positive");
  }
  let otp = '';
  const digits = '0123456789';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}