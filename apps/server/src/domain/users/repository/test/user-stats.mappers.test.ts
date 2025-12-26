import { describe, expect, it } from "vitest";

import { mapTopRenterRows, selectVipCustomer } from "../user-stats.mappers";

describe("user-stats mappers", () => {
  it("maps top renter rows and total records", () => {
    const rows = [
      {
        user_id: "user-1",
        total_rentals: 4,
        fullname: "User One",
        email: "one@example.com",
        avatar: null,
        phone_number: "0900000000",
        location: "HN",
        total_records: 2,
      },
      {
        user_id: "user-2",
        total_rentals: 2,
        fullname: "User Two",
        email: "two@example.com",
        avatar: "avatar.png",
        phone_number: null,
        location: null,
        total_records: 2,
      },
    ];

    const result = mapTopRenterRows(rows);

    expect(result.totalRecords).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].user.id).toBe("user-1");
    expect(result.items[0].totalRentals).toBe(4);
  });

  it("selects vip customer when rows exist", () => {
    const vip = selectVipCustomer([
      {
        user_id: "user-1",
        fullname: "User One",
        total_duration: 120,
      },
    ]);

    expect(vip).toEqual({
      userId: "user-1",
      fullname: "User One",
      totalDuration: 120,
    });
  });

  it("returns null vip customer when rows empty", () => {
    const vip = selectVipCustomer([]);
    expect(vip).toBeNull();
  });
});
