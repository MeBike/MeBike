import { UsersContracts } from "@mebike/shared";
import { describe, expect, it } from "vitest";

describe("admin user request validation", () => {
  it("rejects admin create payload with invalid email", () => {
    const result = UsersContracts.AdminCreateUserRequestSchema.safeParse({
      fullname: "Admin User",
      email: "invalid-email",
      password: "12345678",
      phoneNumber: "0912345678",
    });

    expect(result.success).toBe(false);
  });

  it("rejects admin create payload with invalid phone number", () => {
    const result = UsersContracts.AdminCreateUserRequestSchema.safeParse({
      fullname: "Admin User",
      email: "admin@example.com",
      password: "12345678",
      phoneNumber: "abc123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects admin update payload with invalid email and phone number", () => {
    const result = UsersContracts.AdminUpdateUserRequestSchema.safeParse({
      email: "not-an-email",
      phoneNumber: "123",
    });

    expect(result.success).toBe(false);
  });

  it("accepts admin update payload with empty phone number for clearing field", () => {
    const result = UsersContracts.AdminUpdateUserRequestSchema.safeParse({
      phoneNumber: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBeNull();
    }
  });
});
