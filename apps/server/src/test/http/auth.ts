import jwt from "jsonwebtoken";
import process from "node:process";

type AccessTokenInput = {
  userId: string;
  role?: "USER" | "STAFF" | "TECHNICIAN" | "MANAGER" | "ADMIN" | "AGENCY";
  verifyStatus?: "UNVERIFIED" | "VERIFIED" | "BANNED";
  expiresIn?: jwt.SignOptions["expiresIn"];
};

export function makeAccessToken(input: AccessTokenInput): string {
  return jwt.sign(
    {
      userId: input.userId,
      role: input.role ?? "USER",
      verifyStatus: input.verifyStatus ?? "VERIFIED",
      tokenType: "access",
    },
    process.env.JWT_SECRET ?? "secret",
    {
      algorithm: "HS256",
      expiresIn: input.expiresIn ?? "10m",
    },
  );
}

export function makeAuthHeader(input: AccessTokenInput): { Authorization: string } {
  return {
    Authorization: `Bearer ${makeAccessToken(input)}`,
  };
}
