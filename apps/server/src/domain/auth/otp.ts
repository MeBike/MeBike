import { randomInt } from "node:crypto";

export function generateOtp(): string {
  const n = randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export function isOtpExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
