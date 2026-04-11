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

  it("rejects admin create payload when more than one org assignment scope is provided", () => {
    const result = UsersContracts.AdminCreateUserRequestSchema.safeParse({
      fullname: "Ops User",
      email: "ops@example.com",
      password: "12345678",
      role: "STAFF",
      orgAssignment: {
        stationId: "018d4529-6880-77a8-8e6f-4d2c88d22309",
        technicianTeamId: "018d4529-6880-77a8-8e6f-4d2c88d22310",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts admin create payload with role AGENCY when agency provisioning data is present", () => {
    const result = UsersContracts.AdminCreateUserRequestSchema.safeParse({
      role: "AGENCY",
      requesterEmail: "agency@example.com",
      agencyName: "Metro Agency",
      stationName: "Metro Station",
      stationAddress: "01 Xa Lo Ha Noi",
      stationLatitude: 10.8486,
      stationLongitude: 106.7717,
      stationTotalCapacity: 20,
    });

    expect(result.success).toBe(true);
  });

  it("rejects admin create agency payload when station capacity split exceeds total capacity", () => {
    const result = UsersContracts.AdminCreateUserRequestSchema.safeParse({
      role: "AGENCY",
      requesterEmail: "agency@example.com",
      agencyName: "Metro Agency",
      stationName: "Metro Station",
      stationAddress: "01 Xa Lo Ha Noi",
      stationLatitude: 10.8486,
      stationLongitude: 106.7717,
      stationTotalCapacity: 20,
      stationPickupSlotLimit: 21,
    });

    expect(result.success).toBe(false);
  });

  it("accepts admin update payload with orgAssignment set to null", () => {
    const result = UsersContracts.AdminUpdateUserRequestSchema.safeParse({
      orgAssignment: null,
    });

    expect(result.success).toBe(true);
  });
});
